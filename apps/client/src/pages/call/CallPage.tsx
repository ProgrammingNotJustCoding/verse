import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { VideoRoom } from '@/components/room'
import { roomService } from '@/services/room/room.service'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Debug logging
const DEBUG = true
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[CallPage]', ...args)
}
const error = (...args: unknown[]) => {
  if (DEBUG) console.error('[CallPage]', ...args)
}

export default function CallPage() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [roomData, setRoomData] = useState<{
    roomName: string
    token: string
    isAdmin: boolean
  } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const LIVEKIT_SERVER_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880'

  useEffect(() => {
    log('CallPage mounted with meetingId:', meetingId)
    if (!meetingId) {
      error('No meetingId provided')
      setErrorMessage('Invalid meeting ID')
      setIsLoading(false)
      return
    }

    joinRoom()
  }, [meetingId])

  const joinRoom = async () => {
    if (!meetingId) return

    log('Attempting to join room:', meetingId)
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // Join the room
      log('Step 1: Joining room...')
      const joinResponse = await roomService.joinRoom({ meetingId })
      const { token, room, participant } = joinResponse.data

      log('Step 1 ✓: Joined room successfully')
      log('Room name:', room.name)
      log('Participant:', participant.id)
      log('Is admin:', participant.isAdmin)

      // Set room data
      setRoomData({
        roomName: room.name,
        token,
        isAdmin: participant.isAdmin,
      })

      setIsLoading(false)
      log('✓ Ready to connect to LiveKit')
    } catch (err) {
      error('Failed to join room:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to join room'
      setErrorMessage(errorMsg)
      setIsLoading(false)

      toast.error(errorMsg, {
        style: { background: '#171717', color: '#ff8800' },
      })
    }
  }

  const handleLeave = async () => {
    if (!meetingId) {
      navigate('/dash/calls')
      return
    }

    log('Leaving room:', meetingId)
    try {
      await roomService.leaveRoom(meetingId)
      log('✓ Successfully left room')
      toast.success('Left the call', {
        style: { background: '#171717', color: '#00ff00' },
      })
    } catch (err) {
      error('Failed to leave room:', err)
      // Still navigate away even if leave fails
    }

    navigate('/dash/calls')
  }

  const handleEndRoom = async () => {
    if (!meetingId) {
      navigate('/dash/calls')
      return
    }

    log('Ending room:', meetingId)
    try {
      await roomService.endRoom(meetingId)
      log('✓ Successfully ended room')
      toast.success('Ended the call for everyone', {
        style: { background: '#171717', color: '#00ff00' },
      })
    } catch (err) {
      error('Failed to end room:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to end room', {
        style: { background: '#171717', color: '#ff8800' },
      })
    }

    navigate('/dash/calls')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Joining call...</p>
          <p className="text-sm text-muted-foreground">Meeting ID: {meetingId}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (errorMessage) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold">Failed to Join Call</h2>
          <p className="mb-4 text-sm text-muted-foreground">{errorMessage}</p>
          <button
            onClick={() => navigate('/dash/calls')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Calls
          </button>
        </div>
      </div>
    )
  }

  // Render video room
  if (roomData) {
    log('Rendering VideoRoom with data:', roomData)
    return (
      <VideoRoom
        roomName={roomData.roomName}
        token={roomData.token}
        serverUrl={LIVEKIT_SERVER_URL}
        isAdmin={roomData.isAdmin}
        onLeave={handleLeave}
        onEndRoom={roomData.isAdmin ? handleEndRoom : undefined}
      />
    )
  }

  return null
}
