import * as React from 'react'

import { useDmsStore } from '@/store/dms'
import { useGroupsStore } from '@/store/groups'
import { useSidebarStore } from '@/store/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Chat() {
  const { activeNavItem } = useSidebarStore()
  const { activeGroup, addMessage: addGroupMessage } = useGroupsStore()
  const { activeDm, addMessage: addDmMessage } = useDmsStore()
  const [message, setMessage] = React.useState('')

  const isGroups = activeNavItem?.title === 'Groups'
  const activeConversation = isGroups ? activeGroup : activeDm
  const addMessage = isGroups ? addGroupMessage : addDmMessage

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
      addMessage(activeConversation.id, { text: message, sender: 'You' })
      setMessage('')
    }
  }

  return (
    <div className="flex h-full flex-col bg-background text-card-foreground">
      <div className="flex-1 overflow-y-auto p-4">
        {activeConversation.messages.map(msg => (
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
