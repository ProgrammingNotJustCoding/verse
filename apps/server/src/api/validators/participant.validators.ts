import z from 'zod'

type GetParticipant = {
  participantId: string
}

type GetRoomParticipants = {
  roomId: string
}

export const getParticipantValidator = (params: GetParticipant) => {
  const schema = z.object({
    participantId: z.string().uuid(),
  })

  return schema.safeParse(params)
}

export const getRoomParticipantsValidator = (params: GetRoomParticipants) => {
  const schema = z.object({
    roomId: z.string().uuid(),
  })

  return schema.safeParse(params)
}
