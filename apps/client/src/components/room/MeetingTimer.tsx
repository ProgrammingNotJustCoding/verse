import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface MeetingTimerProps {
  roomCreatedAt: string | null 
}

export function MeetingTimer({ roomCreatedAt }: MeetingTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!roomCreatedAt) {
      setElapsedTime(0)
      return
    }

    
    const calculateElapsed = () => {
      const roomStartTime = new Date(roomCreatedAt).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - roomStartTime) / 1000)
      setElapsedTime(elapsed)
    }

    calculateElapsed()

    
    const interval = setInterval(calculateElapsed, 1000)

    return () => clearInterval(interval)
  }, [roomCreatedAt])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (!roomCreatedAt) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-mono">
        <Clock className="h-4 w-4" />
        <span>--:--</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-mono">
      <Clock className="h-4 w-4 text-primary" />
      <span>{formatTime(elapsedTime)}</span>
    </div>
  )
}
