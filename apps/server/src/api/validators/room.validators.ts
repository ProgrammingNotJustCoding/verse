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

export const createRoomValidator = (body: CreateRoom) => {
  const schema = z.object({
    name: z.string().min(2).max(100),
    maxParticipants: z.number().int().positive().max(100).optional().default(20),
  })

  return schema.safeParse(body)
}

export const joinRoomValidator = (body: JoinRoom) => {
  const schema = z.object({
    meetingId: z.string().length(26).refine(isValidMeetingCode, {
      message: 'Invalid meeting code format',
    }),
  })

  return schema.safeParse(body)
}

export const leaveRoomValidator = (params: LeaveRoom) => {
  const schema = z.object({
    meetingId: z.string().length(26).refine(isValidMeetingCode, {
      message: 'Invalid meeting code format',
    }),
  })

  return schema.safeParse(params)
}

export const endRoomValidator = (params: EndRoom) => {
  const schema = z.object({
    meetingId: z.string().length(26).refine(isValidMeetingCode, {
      message: 'Invalid meeting code format',
    }),
  })

  return schema.safeParse(params)
}

export const removeParticipantValidator = (params: RemoveParticipant) => {
  const schema = z.object({
    meetingId: z.string().length(26).refine(isValidMeetingCode, {
      message: 'Invalid meeting code format',
    }),
    participantId: z.string().uuid(),
  })

  return schema.safeParse(params)
}
