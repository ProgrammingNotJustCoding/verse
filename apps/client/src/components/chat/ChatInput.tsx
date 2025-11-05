import { useState } from 'react'
import { useChat } from '../../hooks/useChat'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Send } from 'lucide-react'

interface ChatInputProps {
  groupId: string | null
}

export function ChatInput({ groupId }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const { sendMessage } = useChat(groupId)
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !groupId || isSending) return

    setIsSending(true)
    const success = await sendMessage(message.trim())
    if (success) {
      setMessage('')
    }
    setIsSending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={groupId ? 'Type a message...' : 'Select a group first'}
          disabled={!groupId || isSending}
          className="flex-1"
        />
        <Button type="submit" disabled={!groupId || !message.trim() || isSending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
