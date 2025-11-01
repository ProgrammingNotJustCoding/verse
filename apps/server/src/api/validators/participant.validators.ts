import z from 'zod'
import { isValidMeetingCode } from '../../utils/meeting.ts'

type GetParticipant = {
  participantId: string
}

type GetRoomParticipants = {
  meetingId: string
}

export const getParticipantValidator = (params: GetParticipant) => {
  const schema = z.object({
    participantId: z.string().uuid(),
  })

  return schema.safeParse(params)
}

export const getRoomParticipantsValidator = (params: GetRoomParticipants) => {
  const schema = z.object({
    meetingId: z.string().length(26).refine(isValidMeetingCode, {
      message: 'Invalid meeting code format',
    }),
  })

  return schema.safeParse(params)
}
