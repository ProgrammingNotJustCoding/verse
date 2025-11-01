import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, X, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/useLiveKit'

interface ChatPanelProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  onClose: () => void
  participantName: string
}

export function ChatPanel({
  messages,
  onSendMessage,
  onClose,
  participantName: _participantName,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendMessage(inputValue.trim())
      setInputValue('')
      inputRef.current?.focus()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isSystemMessage = (message: ChatMessage) => {
    return message.participantIdentity === 'system'
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex h-full flex-col bg-card border-l">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Chat</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'flex flex-col',
                  message.isLocal && !isSystemMessage(message) && 'items-end'
                )}
              >
                {isSystemMessage(message) ? (
                  <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-blue-600 dark:text-blue-400">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{message.message}</p>
                  </div>
                ) : (
                  <>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2',
                        message.isLocal
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {!message.isLocal && (
                        <p className="mb-1 text-xs font-semibold">{message.participantName}</p>
                      )}
                      <p className="text-sm break-words whitespace-pre-wrap">{message.message}</p>
                    </div>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {formatTime(message.timestamp)}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 min-h-[45px] max-h-[120px]"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            size="icon"
            className="h-[45px] self-center"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Shift+Enter for new line • Type /help for commands
        </p>
      </div>
    </div>
  )
}
