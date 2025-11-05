export interface ChatMessage {
  id: string
  groupId: string
  userId: string
  userName: string
  userEmail: string
  content: string
  type: 'message' | 'meeting_started' | 'meeting_ended'
  meetingId?: string
  createdAt: string
}

export interface MessageWithUser {
  message: {
    id: string
    groupId: string
    userId: string
    content: string
    type: 'message' | 'meeting_started' | 'meeting_ended'
    meetingId: string | null
    createdAt: string
  }
  user: {
    id: string
    name: string
    email: string
  }
}

export interface SendMessageData {
  groupId: string
  content: string
}

export interface Caption {
  id: string
  meetingId: string
  participantIdentity: string
  text: string
  startMs: number
  endMs: number
  final: boolean
  createdAt: string
}

export interface MeetingSummary {
  id: string
  meetingId: string
  summary: string
  createdAt: string
}

export interface MessagesResponse {
  success: boolean
  data: MessageWithUser[]
}
