import { API } from '../utils/api'
import { getAuthToken } from './auth.service'
import type { SendMessageData, MessagesResponse } from '../types/chat.types'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAuthToken()}`,
})

export async function sendMessage(data: SendMessageData): Promise<{ success: boolean; data: any }> {
  const res = await fetch(`${API.BASE_URL}${API.CHAT.BASE_URL()}${API.CHAT.SEND_MESSAGE()}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function getGroupMessages(groupId: string, limit = 100): Promise<MessagesResponse> {
  const res = await fetch(
    `${API.BASE_URL}${API.CHAT.BASE_URL()}${API.CHAT.GROUP_MESSAGES(groupId)}?limit=${limit}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  )
  return res.json()
}

export async function getMeetingTranscript(meetingId: string) {
  const res = await fetch(
    `${API.BASE_URL}${API.CHAT.BASE_URL()}${API.CHAT.TRANSCRIPT(meetingId)}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  )
  return res.json()
}

export async function getMeetingSummary(meetingId: string) {
  const res = await fetch(`${API.BASE_URL}${API.CHAT.BASE_URL()}${API.CHAT.SUMMARY(meetingId)}`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return res.json()
}
