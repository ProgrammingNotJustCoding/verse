import { API } from '../utils/api'
import { getAuthToken } from './auth.service'
import type { StartMeetingData, MeetingResponse, MeetingsResponse } from '../types/meetings.types'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAuthToken()}`,
})

export async function startMeeting(data: StartMeetingData): Promise<MeetingResponse> {
  const res = await fetch(`${API.BASE_URL}${API.MEETINGS.BASE_URL()}${API.MEETINGS.START()}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function endMeeting(meetingId: string): Promise<MeetingResponse> {
  const res = await fetch(
    `${API.BASE_URL}${API.MEETINGS.BASE_URL()}${API.MEETINGS.END(meetingId)}`,
    {
      method: 'POST',
      headers: getHeaders(),
    }
  )
  return res.json()
}

export async function getGroupMeetings(groupId: string): Promise<MeetingsResponse> {
  const res = await fetch(
    `${API.BASE_URL}${API.MEETINGS.BASE_URL()}${API.MEETINGS.GROUP_MEETINGS(groupId)}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  )
  return res.json()
}

export async function getActiveMeeting(groupId: string): Promise<MeetingResponse> {
  const res = await fetch(
    `${API.BASE_URL}${API.MEETINGS.BASE_URL()}${API.MEETINGS.ACTIVE_MEETING(groupId)}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  )
  return res.json()
}

export async function getMeeting(meetingId: string): Promise<MeetingResponse> {
  const res = await fetch(
    `${API.BASE_URL}${API.MEETINGS.BASE_URL()}${API.MEETINGS.GET(meetingId)}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  )
  return res.json()
}
