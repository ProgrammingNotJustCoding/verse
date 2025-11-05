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
import {
  createGroup,
  getMyGroups,
  getGroup,
  getGroupMembers,
  joinGroup,
  removeMember,
  updateGroup,
  deleteGroup,
  regenerateInviteCode,
} from './controllers/groups.controller.ts'
import {
  startMeeting,
  endMeeting,
  getGroupMeetings,
  getMeeting,
  getActiveMeeting,
} from './controllers/meetings.controller.ts'
import {
  sendMessage,
  getGroupMessages,
  getMeetingTranscript,
  getMeetingSummary,
} from './controllers/chat.controller.ts'
import { authMiddleware } from './middlewares/auth.middleware.ts'

const authRouter = new Hono()
authRouter.post('/signup', signUp)
authRouter.post('/login', login)

const groupRouter = new Hono()
groupRouter.use('*', authMiddleware)
groupRouter.post('/', createGroup)
groupRouter.get('/', getMyGroups)
groupRouter.get('/:groupId', getGroup)
groupRouter.get('/:groupId/members', getGroupMembers)
groupRouter.post('/join', joinGroup)
groupRouter.delete('/:groupId/members', removeMember)
groupRouter.put('/:groupId', updateGroup)
groupRouter.delete('/:groupId', deleteGroup)
groupRouter.post('/:groupId/regenerate-code', regenerateInviteCode)

const meetingRouter = new Hono()
meetingRouter.use('*', authMiddleware)
meetingRouter.post('/start', startMeeting)
meetingRouter.post('/:meetingId/end', endMeeting)
meetingRouter.get('/group/:groupId', getGroupMeetings)
meetingRouter.get('/group/:groupId/active', getActiveMeeting)
meetingRouter.get('/:meetingId', getMeeting)

const chatRouter = new Hono()
chatRouter.use('*', authMiddleware)
chatRouter.post('/messages', sendMessage)
chatRouter.get('/groups/:groupId/messages', getGroupMessages)
chatRouter.get('/meetings/:meetingId/transcript', getMeetingTranscript)
chatRouter.get('/meetings/:meetingId/summary', getMeetingSummary)

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

export { authRouter, groupRouter, meetingRouter, chatRouter, roomRouter, participantRouter }
