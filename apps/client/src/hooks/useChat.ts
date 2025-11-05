import { useEffect, useRef } from 'react'
import { useGroupsStore } from '../store/groups'
import { useWebSocketStore } from '../store/chat'
import * as chatService from '../services/chat.service'
import { toast } from 'react-hot-toast'
import type { ChatMessage } from '../types/chat.types'

export function useChat(groupId: string | null) {
  const { groupMessages, setGroupMessages, addMessage } = useGroupsStore()
  const {
    isConnected,
    subscribeToGroup,
    unsubscribeFromGroup,
    sendMessage: wsSendMessage,
    setMessageHandler,
  } = useWebSocketStore()

  const messages = groupId ? groupMessages[groupId] || [] : []
  const subscribedRef = useRef<string | null>(null)

  const fetchMessages = async (limit = 100) => {
    if (!groupId) return

    try {
      const response = await chatService.getGroupMessages(groupId, limit)
      if (response.success) {
        const chatMessages: ChatMessage[] = response.data.map(item => ({
          id: item.message.id,
          groupId: item.message.groupId,
          userId: item.message.userId,
          userName: item.user.name,
          userEmail: item.user.email,
          content: item.message.content,
          type: item.message.type,
          meetingId: item.message.meetingId || undefined,
          createdAt: item.message.createdAt,
        }))
        setGroupMessages(groupId, chatMessages.reverse())
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      toast.error('Failed to load messages')
    }
  }

  const sendMessage = async (content: string) => {
    if (!groupId) return false

    try {
      if (isConnected) {
        const sent = wsSendMessage(content, groupId)
        if (sent) {
          return true
        }

        console.log('WebSocket send failed, using HTTP fallback')
        const response = await chatService.sendMessage({ groupId, content })
        if (response.success) {
          addMessage(groupId, response.data)
          return true
        }
        return false
      } else {
        console.log('WebSocket not connected, using HTTP')
        const response = await chatService.sendMessage({ groupId, content })
        if (response.success) {
          addMessage(groupId, response.data)
          return true
        }
        return false
      }
    } catch (err: any) {
      console.error('Send message error:', err)
      toast.error(err.message || 'Failed to send message')
      return false
    }
  }

  // Set up message handler
  useEffect(() => {
    if (!groupId) return

    const handler = (message: ChatMessage) => {
      // Only add if not duplicate
      const existingMessages = useGroupsStore.getState().groupMessages[groupId] || []
      const isDuplicate = existingMessages.some(m => m.id === message.id)

      if (!isDuplicate && message.groupId === groupId) {
        console.log('Adding new message:', message.id)
        addMessage(groupId, message)
      } else if (isDuplicate) {
        console.log('Skipping duplicate message:', message.id)
      }
    }

    setMessageHandler(handler)
  }, [groupId])

  // Subscribe/unsubscribe to group
  useEffect(() => {
    if (!groupId || !isConnected) return

    // Prevent double subscription
    if (subscribedRef.current === groupId) {
      console.log('Already subscribed to:', groupId)
      return
    }

    console.log('Subscribing to group:', groupId)
    subscribeToGroup(groupId)
    fetchMessages()
    subscribedRef.current = groupId

    return () => {
      console.log('Unsubscribing from group:', groupId)
      unsubscribeFromGroup(groupId)
      subscribedRef.current = null
    }
  }, [groupId, isConnected])

  return {
    messages,
    sendMessage,
    fetchMessages,
  }
}
