import type { Context } from 'hono'
import { API_ERRORS } from '../constants/errors.ts'
import {
  createRoomValidator,
  joinRoomValidator,
  leaveRoomValidator,
  endRoomValidator,
  removeParticipantValidator,
} from '../validators/room.validators.ts'
import { roomRepository } from '../../database/repositories/rooms.repository.ts'
import { participantRepository } from '../../database/repositories/participants.repository.ts'
import { userRepository } from '../../database/repositories/users.repository.ts'
import { getRoomParticipantsValidator } from '../validators/participant.validators.ts'

export const createRoom = async (c: Context) => {
  const logger = c.get('logger')
  const db = c.get('db')
  const livekit = c.get('livekit')

  try {
    const body = await c.req.json()
    const validate = createRoomValidator(body)

    if (!validate.success) {
      logger.warn({ error: validate.error }, 'Invalid room creation request')
      return c.json({ error: API_ERRORS.BAD_REQUEST }, 400)
    }

    const { name, maxParticipants } = validate.data
    const userId = c.get('userId')

    console.log('Creating room with name:', name, 'and maxParticipants:', maxParticipants)
    console.log('User ID:', userId)

    if (!userId) {
      return c.json({ error: API_ERRORS.UNAUTHORIZED }, 401)
    }

    const livekitRoom = await livekit.createRoom(name, maxParticipants)

    let room
    try {
      room = await roomRepository(db).create({
        name,
        sid: livekitRoom.sid,
        createdBy: userId,
        maxParticipants,
      })
    } catch (dbErr) {
      try {
        await livekit.deleteRoom(name)
      } catch (lkErr) {
        logger.warn({ lkErr }, 'Failed to delete livekit room after DB failure')
      }
      throw dbErr
    }

    logger.info({ roomId: room.id, sid: livekitRoom.sid, userId }, 'Room created')

    return c.json({ data: { room } }, 201)
  } catch (error) {
    console.error('Error creating room:', error)
    logger.error({ error }, 'Failed to create room')
    return c.json({ error: API_ERRORS.INTERNAL_SERVER_ERROR }, 500)
  }
}

export const joinRoom = async (c: Context) => {
  const logger = c.get('logger')
  const db = c.get('db')
  const livekit = c.get('livekit')

  try {
    const body = await c.req.json()
    const validate = joinRoomValidator(body)

    if (!validate.success) {
      logger.warn({ error: validate.error }, 'Invalid join room request')
      return c.json({ error: API_ERRORS.BAD_REQUEST }, 400)
    }

    const { roomId } = validate.data
    const userId = c.get('userId')

    if (!userId) {
      return c.json({ error: API_ERRORS.UNAUTHORIZED }, 401)
    }

    const room = await roomRepository(db).getById(roomId)
    if (!room) {
      return c.json({ error: API_ERRORS.ROOM_NOT_FOUND }, 404)
    }

    if (room.deletedAt) {
      return c.json({ error: API_ERRORS.ROOM_INACTIVE }, 410)
    }

    const existingParticipant = await participantRepository(db).getActiveByRoomAndUser(
      roomId,
      userId
    )
    if (existingParticipant) {
      return c.json({ error: API_ERRORS.ALREADY_IN_ROOM }, 409)
    }

    const participantCount = await participantRepository(db).getParticipantCount(roomId)
    if (room.maxParticipants && participantCount >= room.maxParticipants) {
      return c.json({ error: API_ERRORS.ROOM_FULL }, 409)
    }

    const user = await userRepository(db).getById(userId)
    if (!user) {
      return c.json({ error: API_ERRORS.USER_NOT_FOUND }, 404)
    }

    const identity = `${userId}_${Date.now()}`
    const token = await livekit.generateToken(room.name, identity, user.name)

    const participant = await participantRepository(db).create({
      roomId: room.id,
      userId,
      identity,
      isAdmin: room.createdBy === userId,
    })

    logger.info({ roomId, userId, identity }, 'User joined room')

    return c.json(
      {
        data: {
          token,
          room,
          participant,
        },
      },
      200
    )
  } catch (error) {
    logger.error({ error }, 'Failed to join room')
    return c.json({ error: API_ERRORS.INTERNAL_SERVER_ERROR }, 500)
  }
}

export const leaveRoom = async (c: Context) => {
  const logger = c.get('logger')
  const db = c.get('db')

  try {
    const roomId = c.req.param('roomId')
    const validate = leaveRoomValidator({ roomId })

    if (!validate.success) {
      logger.warn({ error: validate.error }, 'Invalid leave room request')
      return c.json({ error: API_ERRORS.BAD_REQUEST }, 400)
    }

    const userId = c.get('userId')
    if (!userId) {
      return c.json({ error: API_ERRORS.UNAUTHORIZED }, 401)
    }

    const participant = await participantRepository(db).getActiveByRoomAndUser(roomId, userId)
    if (!participant) {
      return c.json({ error: API_ERRORS.PARTICIPANT_NOT_FOUND }, 404)
    }

    await participantRepository(db).markAsLeft(participant.id)

    logger.info({ roomId, userId, participantId: participant.id }, 'User left room')

    return c.json({ data: { message: 'Left room successfully' } }, 200)
  } catch (error) {
    logger.error({ error }, 'Failed to leave room')
    return c.json({ error: API_ERRORS.INTERNAL_SERVER_ERROR }, 500)
  }
}

export const endRoom = async (c: Context) => {
  const logger = c.get('logger')
  const db = c.get('db')
  const livekit = c.get('livekit')

  try {
    const roomId = c.req.param('roomId')
    const validate = endRoomValidator({ roomId })

    if (!validate.success) {
      logger.warn({ error: validate.error }, 'Invalid end room request')
      return c.json({ error: API_ERRORS.BAD_REQUEST }, 400)
    }

    const userId = c.get('userId')
    if (!userId) {
      return c.json({ error: API_ERRORS.UNAUTHORIZED }, 401)
    }

    const room = await roomRepository(db).getById(roomId)
    if (!room) {
      return c.json({ error: API_ERRORS.ROOM_NOT_FOUND }, 404)
    }

    if (room.createdBy !== userId) {
      return c.json({ error: API_ERRORS.NOT_ROOM_ADMIN }, 403)
    }

    await livekit.deleteRoom(room.name)

    await roomRepository(db).softDelete(roomId)

    await participantRepository(db).markAsLeftByRoomId(roomId)

    logger.info({ roomId, userId }, 'Room ended by admin')

    return c.json({ data: { message: 'Room ended successfully' } }, 200)
  } catch (error) {
    logger.error({ error }, 'Failed to end room')
    return c.json({ error: API_ERRORS.INTERNAL_SERVER_ERROR }, 500)
  }
}

export const getRoomParticipants = async (c: Context) => {
  const logger = c.get('logger')
  const db = c.get('db')

  try {
    const roomId = c.req.param('roomId')
    const validate = getRoomParticipantsValidator({ roomId })

    if (!validate.success) {
      logger.warn({ error: validate.error }, 'Invalid get participants request')
      return c.json({ error: API_ERRORS.BAD_REQUEST }, 400)
    }

    const room = await roomRepository(db).getById(roomId)
    if (!room) {
      return c.json({ error: API_ERRORS.ROOM_NOT_FOUND }, 404)
    }

    const participants = await participantRepository(db).getActiveByRoomId(roomId)

    return c.json({ data: { participants } }, 200)
  } catch (error) {
    logger.error({ error }, 'Failed to get participants')
    return c.json({ error: API_ERRORS.INTERNAL_SERVER_ERROR }, 500)
  }
}

export const removeParticipant = async (c: Context) => {
  const logger = c.get('logger')
  const db = c.get('db')
  const livekit = c.get('livekit')

  try {
    const roomId = c.req.param('roomId')
    const participantId = c.req.param('participantId')
    const validate = removeParticipantValidator({ roomId, participantId })

    if (!validate.success) {
      logger.warn({ error: validate.error }, 'Invalid remove participant request')
      return c.json({ error: API_ERRORS.BAD_REQUEST }, 400)
    }

    const userId = c.get('userId')
    if (!userId) {
      return c.json({ error: API_ERRORS.UNAUTHORIZED }, 401)
    }

    const room = await roomRepository(db).getById(roomId)
    if (!room) {
      return c.json({ error: API_ERRORS.ROOM_NOT_FOUND }, 404)
    }

    if (room.createdBy !== userId) {
      return c.json({ error: API_ERRORS.NOT_ROOM_ADMIN }, 403)
    }

    const participant = await participantRepository(db).getById(participantId)
    if (!participant || participant.roomId !== roomId) {
      return c.json({ error: API_ERRORS.PARTICIPANT_NOT_FOUND }, 404)
    }

    if (participant.userId === userId) {
      return c.json(
        {
          error: {
            code: 400,
            message: 'Cannot Remove Self',
            prettyMessage: 'You cannot remove yourself from the room.',
          },
        },
        400
      )
    }

    await livekit.removeParticipant(room.name, participant.identity)

    await participantRepository(db).markAsLeft(participant.id)

    logger.info({ roomId, participantId, userId }, 'Participant removed by admin')

    return c.json({ data: { message: 'Participant removed successfully' } }, 200)
  } catch (error) {
    logger.error({ error }, 'Failed to remove participant')
    return c.json({ error: API_ERRORS.INTERNAL_SERVER_ERROR }, 500)
  }
}

export const getUserRooms = async (c: Context) => {
  const logger = c.get('logger')
  const db = c.get('db')

  try {
    const userId = c.get('userId')
    if (!userId) {
      return c.json({ error: API_ERRORS.UNAUTHORIZED }, 401)
    }

    const rooms = await roomRepository(db).getByCreator(userId)

    return c.json({ data: { rooms } }, 200)
  } catch (error) {
    logger.error({ error }, 'Failed to get user rooms')
    return c.json({ error: API_ERRORS.INTERNAL_SERVER_ERROR }, 500)
  }
}

export const getRoomDetails = async (c: Context) => {
  const logger = c.get('logger')
  const db = c.get('db')

  try {
    const roomId = c.req.param('roomId')

    const room = await roomRepository(db).getById(roomId)
    if (!room) {
      return c.json({ error: API_ERRORS.ROOM_NOT_FOUND }, 404)
    }

    const participantCount = await participantRepository(db).getParticipantCount(roomId)

    return c.json(
      {
        data: {
          room,
          participantCount,
        },
      },
      200
    )
  } catch (error) {
    logger.error({ error }, 'Failed to get room details')
    return c.json({ error: API_ERRORS.INTERNAL_SERVER_ERROR }, 500)
  }
}
