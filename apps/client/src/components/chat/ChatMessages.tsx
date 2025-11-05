import { useEffect, useRef } from 'react'
import { useChat } from '../../hooks/useChat'
import { ScrollArea } from '../ui/scroll-area'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { Video, VideoOff } from 'lucide-react'

interface ChatMessagesProps {
  groupId: string | null
}

export function ChatMessages({ groupId }: ChatMessagesProps) {
  const { messages } = useChat(groupId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!groupId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a group to start chatting
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map(message => {
          const isSystemMessage = message.type !== 'message'

          if (isSystemMessage) {
            return (
              <div key={message.id} className="flex items-center justify-center py-2">
                <Badge variant="secondary" className="flex items-center gap-2">
                  {message.type === 'meeting_started' ? (
                    <>
                      <Video className="h-3 w-3" />
                      {message.content}
                    </>
                  ) : (
                    <>
                      <VideoOff className="h-3 w-3" />
                      {message.content}
                    </>
                  )}
                </Badge>
              </div>
            )
          }

          return (
            <div key={message.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {message.userName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">{message.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mt-1 break-words">{message.content}</p>
              </div>
            </div>
          )
        })}

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
