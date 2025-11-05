import { API } from '@/utils/api'
import { getAuthToken } from '../auth.service'

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
  meetingId: string
}

export interface Room {
  id: string
  meetingId: string
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

  async leaveRoom(meetingId: string) {
    log('leaveRoom called:', meetingId)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.LEAVE(meetingId)}`
    log('POST', url)

    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      const err = await res.json()
      error('leaveRoom failed:', res.status, err)

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

  async endRoom(meetingId: string) {
    log('endRoom called:', meetingId)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.END(meetingId)}`
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

  async getRoomDetails(meetingId: string) {
    log('getRoomDetails called:', meetingId)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.DETAILS(meetingId)}`
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

  async getRoomParticipants(meetingId: string) {
    log('getRoomParticipants called:', meetingId)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.PARTICIPANTS(meetingId)}`
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

  async removeParticipant(meetingId: string, participantId: string) {
    log('removeParticipant called:', meetingId, participantId)
    const url = `${API.BASE_URL}${API.ROOMS.BASE_URL()}${API.ROOMS.REMOVE_PARTICIPANT(meetingId, participantId)}`
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
