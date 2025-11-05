import z from 'zod'
import { isValidMeetingCode } from '../../utils/meeting.ts'

type CreateRoom = {
  name: string
  maxParticipants?: number
}

type JoinRoom = {
  meetingId: string
}

type LeaveRoom = {
  meetingId: string
}

type EndRoom = {
  meetingId: string
}

type RemoveParticipant = {
  meetingId: string
  participantId: string
}

const isValidMeetingId = (id: string): boolean => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const isShortCode = id.length === 26 && isValidMeetingCode(id)
  return isUUID || isShortCode
}

export const createRoomValidator = (body: CreateRoom) => {
  const schema = z.object({
    name: z.string().min(2).max(100),
    maxParticipants: z.number().int().positive().max(100).optional().default(20),
  })

  return schema.safeParse(body)
}

export const joinRoomValidator = (body: JoinRoom) => {
  const schema = z.object({
    meetingId: z.string().min(1).refine(isValidMeetingId, {
      message: 'Invalid meeting ID format (expected UUID or short code)',
    }),
  })

  return schema.safeParse(body)
}

export const leaveRoomValidator = (params: LeaveRoom) => {
  const schema = z.object({
    meetingId: z.string().min(1).refine(isValidMeetingId, {
      message: 'Invalid meeting ID format (expected UUID or short code)',
    }),
  })

  return schema.safeParse(params)
}

export const endRoomValidator = (params: EndRoom) => {
  const schema = z.object({
    meetingId: z.string().min(1).refine(isValidMeetingId, {
      message: 'Invalid meeting ID format (expected UUID or short code)',
    }),
  })

  return schema.safeParse(params)
}

export const removeParticipantValidator = (params: RemoveParticipant) => {
  const schema = z.object({
    meetingId: z.string().min(1).refine(isValidMeetingId, {
      message: 'Invalid meeting ID format (expected UUID or short code)',
    }),
    participantId: z.string().uuid(),
  })

  return schema.safeParse(params)
}
