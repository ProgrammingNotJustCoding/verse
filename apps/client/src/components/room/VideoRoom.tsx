import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Settings,
  Users,
  MoreVertical,
  AlertCircle,
  Link2,
  Check,
  Pin,
  PinOff,
  Monitor,
  MessageSquare,
} from 'lucide-react'
import { ParticipantVideo } from './ParticipantVideo'
import { ChatPanel } from './ChatPanel'
import { MeetingTimer } from './MeetingTimer'
import { useLiveKit } from '@/hooks/useLiveKit'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Debug logging
const DEBUG = true
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[VideoRoom]', ...args)
}
const logError = (...args: unknown[]) => {
  if (DEBUG) console.error('[VideoRoom]', ...args)
}

interface VideoRoomProps {
  roomName: string
  token: string
  serverUrl: string
  roomCreatedAt: string
  isAdmin?: boolean
  onLeave: () => void
  onEndRoom?: () => void
}

export function VideoRoom({
  roomName,
  token,
  serverUrl,
  roomCreatedAt,
  isAdmin = false,
  onLeave,
  onEndRoom,
}: VideoRoomProps) {
  const {
    isConnecting,
    isConnected,
    participants,
    isCameraEnabled,
    isMicrophoneEnabled,
    error,
    connect,
    disconnect,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    getVideoElement,
    getAudioElement,
    chatMessages,
    sendChatMessage,
    roomCreatedAt: roomCreatedAtFromHook,
    setRoomCreatedAt,
  } = useLiveKit({
    serverUrl,
    onDisconnected: onLeave,
    onError: err => {
      console.error('LiveKit error:', err)
    },
  })

  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showParticipantList, setShowParticipantList] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const hasConnectedRef = useRef(false)
  const lastReadMessageCountRef = useRef(0)

  // Set room creation time from props
  useEffect(() => {
    if (roomCreatedAt && !roomCreatedAtFromHook) {
      setRoomCreatedAt(roomCreatedAt)
    }
  }, [roomCreatedAt, roomCreatedAtFromHook, setRoomCreatedAt])

  useEffect(() => {
    // Prevent multiple connections on remount
    if (hasConnectedRef.current) {
      log('Already connected, skipping mount...')
      return
    }

    log('VideoRoom mounted:', { roomName, serverUrl: serverUrl.substring(0, 30) + '...' })
    log('Token preview:', token.substring(0, 20) + '...')

    // Check environment
    if (!serverUrl) {
      logError('⚠️ CRITICAL: serverUrl is empty! Set VITE_LIVEKIT_URL in .env')
      return
    }

    if (!token) {
      logError('⚠️ CRITICAL: token is empty! Backend should provide valid token')
      return
    }

    log('Environment check passed, connecting...')
    hasConnectedRef.current = true
    connect(token)

    return () => {
      log('VideoRoom unmounting, disconnecting...')
      hasConnectedRef.current = false
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track unread messages when chat is closed
  useEffect(() => {
    if (showChat) {
      // Chat is open, mark all messages as read
      lastReadMessageCountRef.current = chatMessages.length
      setUnreadCount(0)
    } else {
      // Chat is closed, count new messages
      const newMessages = chatMessages.length - lastReadMessageCountRef.current
      if (newMessages > 0) {
        setUnreadCount(newMessages)
      }
    }
  }, [chatMessages.length, showChat])

  const handleRetry = () => {
    log('Retry button clicked, reconnecting...')
    hasConnectedRef.current = false
    connect(token)
  }

  const handleLeave = async () => {
    await disconnect()
    onLeave()
  }

  const handleEndRoom = async () => {
    await disconnect()
    onEndRoom?.()
  }

  const handleCopyLink = () => {
    const roomUrl = `${window.location.origin}/call/${window.location.pathname.split('/').pop()}`
    navigator.clipboard.writeText(roomUrl).then(() => {
      setLinkCopied(true)
      log('Copied room link:', roomUrl)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const handleToggleScreenShare = async () => {
    await toggleScreenShare()
    setIsScreenSharing(!isScreenSharing)
  }

  const handlePinParticipant = (identity: string) => {
    if (pinnedParticipant === identity) {
      setPinnedParticipant(null)
      log('Unpinned participant:', identity)
    } else {
      setPinnedParticipant(identity)
      log('Pinned participant:', identity)
    }
  }

  if (isConnecting) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-lg font-medium">Connecting to room...</p>
          <p className="text-sm text-muted-foreground">{roomName}</p>
        </div>
      </div>
    )
  }

  if (error) {
    const isWebRTCError =
      error.includes('could not establish pc connection') || error.includes('ICE')

    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-2xl rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <h2 className="text-xl font-semibold">Connection Error</h2>
          </div>

          <p className="mb-4 text-sm text-muted-foreground">{error}</p>

          {isWebRTCError && (
            <div className="mb-4 rounded-md border border-orange-500/20 bg-orange-500/10 p-4">
              <h3 className="mb-2 font-semibold text-orange-500">
                ⚠️ Cannot Connect to LiveKit Server
              </h3>
              <p className="mb-2 text-sm text-muted-foreground">
                The WebRTC connection failed. This usually means:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>LiveKit server is NOT running</strong> (most common)
                </li>
                <li>Wrong server URL in environment variables</li>
                <li>Firewall blocking ports 7880-7882</li>
              </ul>

              <div className="mt-3 rounded bg-background/50 p-3 font-mono text-xs">
                <p className="mb-1 font-semibold">Current Configuration:</p>
                <p>Server URL: {serverUrl}</p>
                <p>Room: {roomName}</p>
              </div>

              <div className="mt-3 rounded bg-red-500/10 border border-red-500/20 p-3 text-sm">
                <p className="font-semibold text-red-500 mb-2">🔧 How to Fix:</p>
                <div className="space-y-2 text-muted-foreground">
                  <div>
                    <p className="font-semibold">Step 1: Start LiveKit Server</p>
                    <div className="ml-4 mt-1 rounded bg-background/80 p-2 font-mono text-xs">
                      <p>docker run --rm -p 7880:7880 \</p>
                      <p className="ml-2">-e LIVEKIT_KEYS="devkey: secret" \</p>
                      <p className="ml-2">livekit/livekit-server</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Step 2: Verify .env file</p>
                    <div className="ml-4 mt-1 rounded bg-background/80 p-2 font-mono text-xs">
                      <p>VITE_LIVEKIT_URL=ws://localhost:7880</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Step 3: Restart dev server</p>
                    <p className="ml-4 text-xs">Kill and restart: pnpm dev</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleRetry} variant="default">
              Try Again
            </Button>
            <Button onClick={onLeave} variant="outline">
              Back to Calls
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-medium">Disconnected</p>
          <Button onClick={onLeave} className="mt-4">
            Back to Calls
          </Button>
        </div>
      </div>
    )
  }

  // Determine layout based on pinned state
  const pinnedParticipantData = pinnedParticipant
    ? participants.find(p => p.identity === pinnedParticipant)
    : null
  const unpinnedParticipants = pinnedParticipant
    ? participants.filter(p => p.identity !== pinnedParticipant)
    : null

  const localParticipant = participants.find(p => p.isLocal && !p.isScreenShare)

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{roomName}</h1>
            <Badge variant="secondary">
              <Users className="mr-1 h-3 w-3" />
              {participants.length}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {/* Meeting Timer */}
            <MeetingTimer roomCreatedAt={roomCreatedAt} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={handleEndRoom} className="text-destructive">
                    <PhoneOff className="mr-2 h-4 w-4" />
                    End Room for All
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main video area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 p-4">
          {participants.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Users className="mx-auto mb-2 h-12 w-12" />
                <p>No participants yet</p>
              </div>
            </div>
          ) : pinnedParticipantData ? (
            // Pinned layout - large pinned view with small thumbnails
            <div className="flex h-full gap-4">
              {/* Main pinned view */}
              <div className="flex-1 relative group">
                <ParticipantVideo
                  identity={pinnedParticipantData.identity}
                  name={pinnedParticipantData.name || pinnedParticipantData.identity}
                  videoTrack={pinnedParticipantData.videoTrack}
                  audioTrack={pinnedParticipantData.audioTrack}
                  screenShareTrack={pinnedParticipantData.screenShareTrack}
                  isSpeaking={pinnedParticipantData.isSpeaking}
                  isMuted={pinnedParticipantData.isLocal ? !isMicrophoneEnabled : undefined}
                  isVideoOff={pinnedParticipantData.isLocal ? !isCameraEnabled : undefined}
                  isLocal={pinnedParticipantData.isLocal}
                  isScreenShare={pinnedParticipantData.isScreenShare}
                  getVideoElement={() =>
                    getVideoElement(
                      pinnedParticipantData.identity,
                      pinnedParticipantData.isScreenShare
                    )
                  }
                  getAudioElement={() => getAudioElement(pinnedParticipantData.identity)}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handlePinParticipant(pinnedParticipantData.identity)}
                >
                  <PinOff className="h-4 w-4 mr-2" />
                  Unpin
                </Button>
              </div>

              {/* Thumbnail strip */}
              {unpinnedParticipants && unpinnedParticipants.length > 0 && (
                <div className="w-64 flex flex-col gap-3 overflow-y-auto">
                  {unpinnedParticipants.map(participant => (
                    <div key={participant.identity} className="relative group">
                      <ParticipantVideo
                        identity={participant.identity}
                        name={participant.name || participant.identity}
                        videoTrack={participant.videoTrack}
                        audioTrack={participant.audioTrack}
                        screenShareTrack={participant.screenShareTrack}
                        isSpeaking={participant.isSpeaking}
                        isMuted={participant.isLocal ? !isMicrophoneEnabled : undefined}
                        isVideoOff={participant.isLocal ? !isCameraEnabled : undefined}
                        isLocal={participant.isLocal}
                        isScreenShare={participant.isScreenShare}
                        getVideoElement={() =>
                          getVideoElement(participant.identity, participant.isScreenShare)
                        }
                        getAudioElement={() => getAudioElement(participant.identity)}
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => handlePinParticipant(participant.identity)}
                      >
                        <Pin className="h-3 w-3" />
                      </Button>
                      {participant.isScreenShare && (
                        <Badge className="absolute top-2 left-2 bg-blue-500">
                          <Monitor className="h-3 w-3 mr-1" />
                          Screen
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Default grid layout
            <div
              className={cn(
                'grid h-full gap-4',
                participants.length === 1 && 'grid-cols-1',
                participants.length === 2 && 'grid-cols-2',
                participants.length >= 3 && participants.length <= 4 && 'grid-cols-2 grid-rows-2',
                participants.length >= 5 && participants.length <= 9 && 'grid-cols-3 grid-rows-3',
                participants.length >= 10 && 'grid-cols-4'
              )}
            >
              {participants.map(participant => (
                <div key={participant.identity} className="relative group">
                  <ParticipantVideo
                    identity={participant.identity}
                    name={participant.name || participant.identity}
                    videoTrack={participant.videoTrack}
                    audioTrack={participant.audioTrack}
                    screenShareTrack={participant.screenShareTrack}
                    isSpeaking={participant.isSpeaking}
                    isMuted={participant.isLocal ? !isMicrophoneEnabled : undefined}
                    isVideoOff={participant.isLocal ? !isCameraEnabled : undefined}
                    isLocal={participant.isLocal}
                    isScreenShare={participant.isScreenShare}
                    getVideoElement={() =>
                      getVideoElement(participant.identity, participant.isScreenShare)
                    }
                    getAudioElement={() => getAudioElement(participant.identity)}
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handlePinParticipant(participant.identity)}
                  >
                    <Pin className="h-4 w-4" />
                  </Button>
                  {participant.isScreenShare && (
                    <Badge className="absolute top-2 left-2 bg-blue-500">
                      <Monitor className="h-3 w-3 mr-1" />
                      Screen
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-80 h-full">
            <ChatPanel
              messages={chatMessages}
              onSendMessage={sendChatMessage}
              onClose={() => setShowChat(false)}
              participantName={localParticipant?.name || 'You'}
            />
          </div>
        )}

        {/* Participant list sidebar */}
        {showParticipantList && (
          <div className="w-64 border-l bg-card p-4">
            <h3 className="mb-4 font-semibold">Participants ({participants.length})</h3>
            <div className="space-y-2">
              {participants.map(participant => (
                <div
                  key={participant.identity}
                  className="flex items-center gap-2 rounded-lg border bg-background p-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {participant.name}
                      {participant.isLocal && ' (You)'}
                    </p>
                  </div>
                  {participant.isSpeaking && (
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="border-t bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="w-[120px]"></div>

          <div className="flex items-center gap-2">
            {/* Microphone toggle */}
            <Button
              variant={isMicrophoneEnabled ? 'default' : 'destructive'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleMicrophone}
            >
              {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            {/* Camera toggle */}
            <Button
              variant={isCameraEnabled ? 'default' : 'destructive'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleCamera}
            >
              {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            {/* Screen share toggle */}
            <Button
              variant={isScreenSharing ? 'secondary' : 'outline'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleToggleScreenShare}
            >
              <MonitorUp className="h-5 w-5" />
            </Button>

            {/* Leave button */}
            <Button
              variant="destructive"
              size="lg"
              className="ml-4 rounded-full"
              onClick={handleLeave}
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              Leave
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showChat ? 'secondary' : 'ghost'}
              size="icon"
              className="h-12 w-12 rounded-full relative"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && !showChat && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button
              variant={showParticipantList ? 'secondary' : 'ghost'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setShowParticipantList(!showParticipantList)}
            >
              <Users className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
