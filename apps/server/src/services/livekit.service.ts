import { RoomServiceClient, AccessToken } from 'livekit-server-sdk'
import type { Environment } from '../config/env.ts'

export const createLivekitService = (env: Environment) => {
  // Ensure URL has protocol
  const livekitUrl = env.LIVEKIT_HOST.startsWith('http')
    ? env.LIVEKIT_HOST
    : `http://${env.LIVEKIT_HOST}`

  const roomService = new RoomServiceClient(livekitUrl, env.LIVEKIT_API_KEY, env.LIVEKIT_SECRET_KEY)

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

  const generateToken = async (
    roomName: string,
    participantIdentity: string,
    participantName: string
  ) => {
    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_SECRET_KEY, {
      identity: participantIdentity,
      name: participantName,
    })

    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true })

    return await at.toJwt()
  }

  const dispatchRoomAgent = async (roomName: string) => {
    try {
      const agentDispatch = {
        room: roomName,
        agentName: 'caption-agent',
      }

      await roomService.listRooms([roomName])

      return agentDispatch
    } catch (error) {
      console.error('Failed to dispatch agent:', error)
      throw error
    }
  }

  return {
    createRoom,
    deleteRoom,
    listParticipants,
    removeParticipant,
    generateToken,
    roomService,
    dispatchRoomAgent,
  }
}

export type LivekitService = ReturnType<typeof createLivekitService>
