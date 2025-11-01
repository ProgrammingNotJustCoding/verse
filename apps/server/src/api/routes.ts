import { Hono } from 'hono'
import { login, signUp } from './controllers/auth.controller.ts'
import {
  createRoom,
  joinRoom,
  leaveRoom,
  endRoom,
  getRoomParticipants,
  removeParticipant,
  getUserRooms,
  getRoomDetails,
} from './controllers/room.controller.ts'
import { getParticipant, getUserParticipations } from './controllers/participants.controller.ts'
import { authMiddleware } from './middlewares/auth.middleware.ts'

const authRouter = new Hono()

authRouter.post('/signup', signUp)
authRouter.post('/login', login)

const roomRouter = new Hono()

roomRouter.use('*', authMiddleware)
roomRouter.post('/', createRoom)
roomRouter.get('/', getUserRooms)
roomRouter.get('/:meetingId', getRoomDetails)
roomRouter.post('/join', joinRoom)
roomRouter.post('/:meetingId/leave', leaveRoom)
roomRouter.delete('/:meetingId', endRoom)

roomRouter.get('/:meetingId/participants', getRoomParticipants)
roomRouter.delete('/:meetingId/participants/:participantId', removeParticipant)

const participantRouter = new Hono()

participantRouter.get('/me', getUserParticipations)
participantRouter.get('/:participantId', getParticipant)

export { authRouter, roomRouter, participantRouter }
