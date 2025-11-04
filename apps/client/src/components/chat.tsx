import * as React from 'react'

import { useDmsStore } from '@/store/dms'
import { useGroupsStore } from '@/store/groups'
import { useSidebarStore } from '@/store/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Chat() {
  const { activeNavItem } = useSidebarStore()
  const { activeGroup, addMessage: addGroupMessage, groupMessages } = useGroupsStore()
  const { activeDm, addMessage: addDmMessage } = useDmsStore()
  const [message, setMessage] = React.useState('')

  const isGroups = activeNavItem?.title === 'Groups'
  const activeConversation = isGroups ? activeGroup : activeDm

  if (!activeConversation) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-card-foreground">
        <p>Select a {isGroups ? 'group' : 'chat'} to start messaging.</p>
      </div>
    )
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message && activeConversation) {
      if (isGroups && activeGroup) {
        addGroupMessage(activeConversation.id, {
          id: `msg-${Date.now()}`,
          groupId: activeConversation.id,
          userId: 'current-user',
          userName: 'You',
          userEmail: 'user@example.com',
          content: message,
          type: 'message',
          createdAt: new Date().toISOString(),
        })
      } else {
        addDmMessage(activeConversation.id, { text: message, sender: 'You' })
      }
      setMessage('')
    }
  }

  const messages =
    isGroups && activeGroup ? groupMessages[activeGroup.id] || [] : activeDm?.messages || []

  return (
    <div className="flex h-full flex-col bg-background text-card-foreground">
      <div className="flex-1 overflow-y-auto p-4">
        {isGroups
          ? // Render group messages (ChatMessage type)
            messages.map((msg: any) => (
              <div key={msg.id} className="mb-4">
                <p className="font-semibold">{msg.userName || msg.participantName}</p>
                <p>{msg.content || msg.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))
          : // Render DM messages (Message type)
            messages.map((msg: any) => (
              <div key={msg.id} className="mb-4">
                <p className="font-semibold">{msg.sender}</p>
                <p>{msg.text}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
      </div>
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t p-4">
        <Input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  )
}
