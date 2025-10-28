import { RoomServiceClient, AccessToken } from 'livekit-server-sdk'
import type { Environment } from '../config/env.ts'

export const createLivekitService = (env: Environment) => {
  const roomService = new RoomServiceClient(
    env.LIVEKIT_HOST,
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_SECRET_KEY
  )

  const createRoom = async (roomName: string, maxParticipants: number = 20) => {
    const opts = {
      name: roomName,
      emptyTimeout: 10 * 60,
      maxParticipants,
    }

    const room = await roomService.createRoom(opts)
    return room
  }

  const deleteRoom = async (roomName: string) => {
    await roomService.deleteRoom(roomName)
  }

  const listParticipants = async (roomName: string) => {
    const participants = await roomService.listParticipants(roomName)
    return participants
  }

  const removeParticipant = async (roomName: string, identity: string) => {
    await roomService.removeParticipant(roomName, identity)
  }

  const generateToken = (
    roomName: string,
    participantIdentity: string,
    participantName: string
  ) => {
    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_SECRET_KEY, {
      identity: participantIdentity,
      name: participantName,
    })

    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true })

    return at.toJwt()
  }

  return {
    createRoom,
    deleteRoom,
    listParticipants,
    removeParticipant,
    generateToken,
    roomService,
  }
}

export type LivekitService = ReturnType<typeof createLivekitService>
