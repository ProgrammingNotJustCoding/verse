import z from 'zod'

type CreateRoom = {
  name: string
  maxParticipants?: number
}

type JoinRoom = {
  roomId: string
}

type LeaveRoom = {
  roomId: string
}

type EndRoom = {
  roomId: string
}

type RemoveParticipant = {
  roomId: string
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
    roomId: z.string().uuid(),
  })

  return schema.safeParse(body)
}

export const leaveRoomValidator = (params: LeaveRoom) => {
  const schema = z.object({
    roomId: z.string().uuid(),
  })

  return schema.safeParse(params)
}

export const endRoomValidator = (params: EndRoom) => {
  const schema = z.object({
    roomId: z.string().uuid(),
  })

  return schema.safeParse(params)
}

export const removeParticipantValidator = (params: RemoveParticipant) => {
  const schema = z.object({
    roomId: z.string().uuid(),
    participantId: z.string().uuid(),
  })

  return schema.safeParse(params)
}
