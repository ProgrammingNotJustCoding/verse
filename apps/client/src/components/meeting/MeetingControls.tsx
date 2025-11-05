import { useMeetings } from '../../hooks/useMeetings'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Video, VideoOff, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface MeetingControlsProps {
  groupId: string | null
}

export function MeetingControls({ groupId }: MeetingControlsProps) {
  const { currentMeeting, startMeeting, endMeeting } = useMeetings(groupId)
  const [isStarting, setIsStarting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const navigate = useNavigate()

  const handleStart = async () => {
    setIsStarting(true)
    const result = await startMeeting()
    setIsStarting(false)

    if (result) {
      navigate(`/call/${result.meeting.id}`)
    }
  }

  const handleEnd = async () => {
    if (!currentMeeting) return
    setIsEnding(true)
    await endMeeting(currentMeeting.id)
    setIsEnding(false)
  }

  const handleJoin = () => {
    if (currentMeeting) {
      navigate(`/call/${currentMeeting.id}`)
    }
  }

  if (!groupId) {
    return null
  }

  return (
    <div className="p-4 border-b bg-muted/30">
      {currentMeeting ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="animate-pulse">
              <Video className="h-3 w-3 mr-1" />
              Live
            </Badge>
            <div className="text-sm">
              <div className="font-semibold">{currentMeeting.name || 'Group Meeting'}</div>
              <div className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Started{' '}
                {formatDistanceToNow(new Date(currentMeeting.startedAt), { addSuffix: true })}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={handleJoin}>
              <Video className="h-4 w-4 mr-1" />
              Join Call
            </Button>
            <Button size="sm" variant="destructive" onClick={handleEnd} disabled={isEnding}>
              <VideoOff className="h-4 w-4 mr-1" />
              {isEnding ? 'Ending...' : 'End Meeting'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">No active meeting</div>
          <Button size="sm" onClick={handleStart} disabled={isStarting}>
            <Video className="h-4 w-4 mr-1" />
            {isStarting ? 'Starting...' : 'Start Meeting'}
          </Button>
        </div>
      )}
    </div>
  )
}
