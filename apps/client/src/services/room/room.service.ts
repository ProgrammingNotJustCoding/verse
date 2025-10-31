import { API } from '@/utils/api'
import { getAuthToken } from '../auth.service'

// Debug logging
const DEBUG = true
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[RoomService]', ...args)
}
const error = (...args: unknown[]) => {
  if (DEBUG) console.error('[RoomService]', ...args)
}

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAuthToken() || ''}`,
})

export interface CreateRoomData {
  name: string
  maxParticipants?: number
}

export interface JoinRoomData {
  roomId: string
}

export interface Room {
  id: string
  name: string
  sid: string
  createdBy: string
  maxParticipants?: number
  createdAt: string
  deletedAt?: string
}

export interface Participant {
  id: string
  roomId: string
  userId: string
  identity: string
  isAdmin: boolean
  joinedAt: string
  leftAt?: string
}

export interface JoinRoomResponse {
  token: string
  room: Room
  participant: Participant
}

export const roomService = {
  async createRoom(data: CreateRoomData) {
    log('createRoom called:', data)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.CREATE()}`
    log('POST', url)

    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      error('createRoom failed:', res.status, err)
      throw new Error(err.error?.prettyMessage || 'Failed to create room')
    }

    const result = await res.json()
    log('createRoom success:', result)
    return result as { data: { room: Room } }
  },

  async joinRoom(data: JoinRoomData) {
    log('joinRoom called:', data)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.JOIN()}`
    log('POST', url)

    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      error('joinRoom failed:', res.status, err)
      throw new Error(err.error?.prettyMessage || 'Failed to join room')
    }

    const result = await res.json()
    log('joinRoom success, token received')
    return result as { data: JoinRoomResponse }
  },

  async leaveRoom(roomId: string) {
    log('leaveRoom called:', roomId)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.LEAVE(roomId)}`
    log('POST', url)

    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      const err = await res.json()
      error('leaveRoom failed:', res.status, err)
      // Don't throw on 404 - participant might already be gone
      if (res.status === 404) {
        log('Participant already left (404), treating as success')
        return { data: { message: 'Already left' } }
      }
      throw new Error(err.error?.prettyMessage || 'Failed to leave room')
    }

    const result = await res.json()
    log('leaveRoom success')
    return result as { data: { message: string } }
  },

  async endRoom(roomId: string) {
    log('endRoom called:', roomId)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.END(roomId)}`
    log('DELETE', url)

    const res = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      const err = await res.json()
      error('endRoom failed:', res.status, err)
      throw new Error(err.error?.prettyMessage || 'Failed to end room')
    }

    const result = await res.json()
    log('endRoom success')
    return result as { data: { message: string } }
  },

  async getRoomDetails(roomId: string) {
    log('getRoomDetails called:', roomId)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.DETAILS(roomId)}`
    log('GET', url)

    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      const err = await res.json()
      error('getRoomDetails failed:', res.status, err)
      throw new Error(err.error?.prettyMessage || 'Failed to get room details')
    }

    const result = await res.json()
    log('getRoomDetails success')
    return result as { data: { room: Room; participantCount: number } }
  },

  async getRoomParticipants(roomId: string) {
    log('getRoomParticipants called:', roomId)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.PARTICIPANTS(roomId)}`
    log('GET', url)

    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      const err = await res.json()
      error('getRoomParticipants failed:', res.status, err)
      throw new Error(err.error?.prettyMessage || 'Failed to get participants')
    }

    const result = await res.json()
    log('getRoomParticipants success:', result.data.participants.length, 'participants')
    return result as { data: { participants: Participant[] } }
  },

  async removeParticipant(roomId: string, participantId: string) {
    log('removeParticipant called:', roomId, participantId)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.REMOVE_PARTICIPANT(roomId, participantId)}`
    log('DELETE', url)

    const res = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      const err = await res.json()
      error('removeParticipant failed:', res.status, err)
      throw new Error(err.error?.prettyMessage || 'Failed to remove participant')
    }

    const result = await res.json()
    log('removeParticipant success')
    return result as { data: { message: string } }
  },

  async getUserRooms() {
    log('getUserRooms called')
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.USER_ROOMS()}`
    log('GET', url)

    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      const err = await res.json()
      error('getUserRooms failed:', res.status, err)
      throw new Error(err.error?.prettyMessage || 'Failed to get user rooms')
    }

    const result = await res.json()
    log('getUserRooms success:', result.data.rooms.length, 'rooms')
    return result as { data: { rooms: Room[] } }
  },
}
