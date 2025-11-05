import { create } from 'zustand'
import { API } from '../utils/api'
import { getAuthToken } from '../services/auth.service'
import type { ChatMessage } from '../types/chat.types'

interface WebSocketState {
  ws: WebSocket | null
  isConnected: boolean
  subscribedGroups: Set<string>
  currentGroupId: string | null

  // Actions
  connect: () => void
  disconnect: () => void
  subscribeToGroup: (groupId: string) => void
  unsubscribeFromGroup: (groupId: string) => void
  sendMessage: (content: string, groupId: string) => boolean
  setMessageHandler: (handler: (message: ChatMessage) => void) => void
}

let messageHandler: ((message: ChatMessage) => void) | null = null
let reconnectTimeout: NodeJS.Timeout | null = null

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  ws: null,
  isConnected: false,
  subscribedGroups: new Set(),
  currentGroupId: null,

  connect: () => {
    const token = getAuthToken()
    if (!token) {
      console.error('No auth token found')
      return
    }

    // Check if already connected
    const { ws: existingWs } = get()
    if (existingWs && existingWs.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    const ws = new WebSocket(API.WS_URL)

    ws.onopen = () => {
      console.log('WebSocket connected')
      set({ ws, isConnected: true })

      // Clear reconnect timeout
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
    }

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)
        console.log('WebSocket message received:', data)

        if (data.type === 'message' && messageHandler) {
          messageHandler(data.data)
        } else if (data.type === 'error') {
          console.error('WebSocket error from server:', data.message)
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = error => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      set({ isConnected: false, ws: null })

      // Attempt to reconnect after 3 seconds
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          const { isConnected } = get()
          if (!isConnected) {
            console.log('Attempting to reconnect...')
            get().connect()
          }
        }, 3000)
      }
    }

    set({ ws })
  },

  disconnect: () => {
    const { ws } = get()
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    if (ws) {
      ws.close()
      set({ ws: null, isConnected: false, subscribedGroups: new Set() })
    }
  },

  subscribeToGroup: groupId => {
    const { ws, subscribedGroups, isConnected } = get()
    const token = getAuthToken()

    if (!isConnected || !ws || ws.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not ready, waiting...')
      // Retry after connection is established
      setTimeout(() => {
        const { isConnected: nowConnected } = get()
        if (nowConnected) {
          get().subscribeToGroup(groupId)
        }
      }, 1000)
      return
    }

    // Check if already subscribed
    if (subscribedGroups.has(groupId)) {
      console.log('Already subscribed to:', groupId)
      return
    }

    if (token) {
      ws.send(JSON.stringify({ type: 'subscribe', groupId, token }))
      subscribedGroups.add(groupId)
      set({ subscribedGroups: new Set(subscribedGroups), currentGroupId: groupId })
      console.log('Subscribed to group:', groupId)
    }
  },

  unsubscribeFromGroup: groupId => {
    const { ws, subscribedGroups } = get()

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'unsubscribe', groupId }))
      subscribedGroups.delete(groupId)
      set({ subscribedGroups: new Set(subscribedGroups) })
      console.log('Unsubscribed from group:', groupId)
    }
  },

  sendMessage: (content, groupId) => {
    const { ws, isConnected } = get()

    if (!isConnected || !ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected, state:', ws?.readyState)
      return false
    }

    try {
      ws.send(JSON.stringify({ type: 'message', content, groupId }))
      console.log('Sent message via WebSocket')
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      return false
    }
  },

  setMessageHandler: handler => {
    messageHandler = handler
  },
}))
