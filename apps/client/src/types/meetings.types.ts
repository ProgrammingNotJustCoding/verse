export interface Meeting {
  id: string
  groupId: string
  name: string | null
  startedBy: string | null
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  createdAt: string
}

export interface MeetingWithDetails {
  meeting: Meeting
  room: {
    sid: string
    name: string
  } | null
  startedByUser: {
    id: string
    name: string
    email: string
  } | null
}

export interface StartMeetingData {
  groupId: string
  name?: string
}

export interface MeetingResponse {
  success: boolean
  data: {
    meeting: Meeting
    room: {
      sid: string
      name: string
    }
  }
}

export interface MeetingsResponse {
  success: boolean
  data: MeetingWithDetails[]
}
