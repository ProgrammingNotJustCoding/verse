import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  LocalTrackPublication,
  Track,
  VideoPresets,
  LocalVideoTrack,
  LocalAudioTrack,
} from 'livekit-client'

const DEBUG = true
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[useLiveKit]', ...args)
}
const logError = (...args: unknown[]) => {
  if (DEBUG) console.error('[useLiveKit]', ...args)
}

export interface UseLiveKitOptions {
  serverUrl: string
  onDisconnected?: () => void
  onError?: (error: Error) => void
}

export interface ParticipantInfo {
  identity: string
  name?: string
  isSpeaking: boolean
  audioTrack?: RemoteTrack | MediaStreamTrack
  videoTrack?: RemoteTrack | MediaStreamTrack
  screenShareTrack?: RemoteTrack | MediaStreamTrack
  isLocal: boolean
  isScreenShare?: boolean
  screenShareIdentity?: string
}

export interface ChatMessage {
  id: string
  participantIdentity: string
  participantName: string
  message: string
  timestamp: number
  isLocal: boolean
  isSystem?: boolean
}

export interface Bookmark {
  id: string
  timestamp: number
  meetingTime: number
  message: string
  createdAt: number
}

export interface Transcription {
  id: string
  participantIdentity: string
  participantName: string
  text: string
  isFinal: boolean
  timestamp: number
}

export function useLiveKit(options: UseLiveKitOptions) {
  const { serverUrl, onDisconnected, onError } = options

  const roomRef = useRef<Room | null>(null)
  const isConnectingRef = useRef(false)
  const isDisconnectingRef = useRef(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState<Map<string, ParticipantInfo>>(new Map())
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(null)
  const [isCameraEnabled, setIsCameraEnabled] = useState(false)
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false)
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [roomCreatedAt, setRoomCreatedAt] = useState<string | null>(null)

  const updateParticipants = useCallback(() => {
    const room = roomRef.current
    if (!room) return

    const participantMap = new Map<string, ParticipantInfo>()

    const localParticipant = room.localParticipant
    const localVideoPublication = localParticipant.getTrackPublication(Track.Source.Camera)
    const localAudioPublication = localParticipant.getTrackPublication(Track.Source.Microphone)
    const localScreenPublication = localParticipant.getTrackPublication(Track.Source.ScreenShare)

    log('Local participant tracks:', {
      video: localVideoPublication?.track?.kind,
      audio: localAudioPublication?.track?.kind,
      screen: localScreenPublication?.track?.kind,
      videoEnabled: localParticipant.isCameraEnabled,
      audioEnabled: localParticipant.isMicrophoneEnabled,
    })

    participantMap.set(localParticipant.identity, {
      identity: localParticipant.identity,
      name: localParticipant.name || 'You',
      isSpeaking: localParticipant.isSpeaking,
      audioTrack: localAudioPublication?.track?.mediaStreamTrack,
      videoTrack: localVideoPublication?.track?.mediaStreamTrack,
      screenShareTrack: localScreenPublication?.track?.mediaStreamTrack,
      isLocal: true,
      isScreenShare: false,
    })

    if (localScreenPublication?.track) {
      participantMap.set(`${localParticipant.identity}_screen`, {
        identity: `${localParticipant.identity}_screen`,
        name: `${localParticipant.name || 'You'}'s Screen`,
        isSpeaking: false,
        videoTrack: localScreenPublication.track.mediaStreamTrack,
        isLocal: true,
        isScreenShare: true,
        screenShareIdentity: localParticipant.identity,
      })
    }

    room.remoteParticipants.forEach((participant: RemoteParticipant) => {
      const videoPublication = participant.getTrackPublication(Track.Source.Camera)
      const audioPublication = participant.getTrackPublication(Track.Source.Microphone)
      const screenPublication = participant.getTrackPublication(Track.Source.ScreenShare)

      log('Remote participant tracks:', participant.identity, {
        video: videoPublication?.track?.kind,
        audio: audioPublication?.track?.kind,
        screen: screenPublication?.track?.kind,
        videoSubscribed: videoPublication?.isSubscribed,
        audioSubscribed: audioPublication?.isSubscribed,
      })

      participantMap.set(participant.identity, {
        identity: participant.identity,
        name: participant.name || participant.identity,
        isSpeaking: participant.isSpeaking,
        audioTrack: audioPublication?.track,
        videoTrack: videoPublication?.track,
        screenShareTrack: screenPublication?.track,
        isLocal: false,
        isScreenShare: false,
      })

      if (screenPublication?.track) {
        participantMap.set(`${participant.identity}_screen`, {
          identity: `${participant.identity}_screen`,
          name: `${participant.name || participant.identity}'s Screen`,
          isSpeaking: false,
          videoTrack: screenPublication.track,
          isLocal: false,
          isScreenShare: true,
          screenShareIdentity: participant.identity,
        })
      }
    })

    log('Updated participants count:', participantMap.size)
    setParticipants(participantMap)
  }, [])

  const connect = useCallback(
    async (token: string) => {
      if (isConnectingRef.current) {
        log('Already connecting, skipping...')
        return
      }

      if (roomRef.current?.state === 'connected') {
        log('Already connected, skipping...')
        return
      }

      try {
        log('Starting connection with token:', token.substring(0, 20) + '...')
        isConnectingRef.current = true
        setIsConnecting(true)
        setError(null)

        log('Creating Room instance...')
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
        })

        log('Server URL:', serverUrl)

        room
          .on(
            RoomEvent.TrackSubscribed,
            (
              track: RemoteTrack,
              _publication: RemoteTrackPublication,
              participant: RemoteParticipant
            ) => {
              log('Track subscribed:', track.kind, participant.identity)
              updateParticipants()
            }
          )
          .on(
            RoomEvent.TrackUnsubscribed,
            (
              track: RemoteTrack,
              _publication: RemoteTrackPublication,
              participant: RemoteParticipant
            ) => {
              log('Track unsubscribed:', track.kind, participant.identity)
              updateParticipants()
            }
          )
          .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
            log('Participant connected:', participant.identity)

            const systemMessage: ChatMessage = {
              id: `system-join-${Date.now()}-${participant.identity}`,
              participantIdentity: 'system',
              participantName: 'System',
              message: `${participant.name || participant.identity} joined the call`,
              timestamp: Date.now(),
              isLocal: false,
              isSystem: true,
            }
            setChatMessages(prev => [...prev, systemMessage])
            updateParticipants()
          })
          .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
            log('Participant disconnected:', participant.identity)

            const systemMessage: ChatMessage = {
              id: `system-leave-${Date.now()}-${participant.identity}`,
              participantIdentity: 'system',
              participantName: 'System',
              message: `${participant.name || participant.identity} left the call`,
              timestamp: Date.now(),
              isLocal: false,
              isSystem: true,
            }
            setChatMessages(prev => [...prev, systemMessage])
            updateParticipants()
          })
          .on(RoomEvent.ActiveSpeakersChanged, () => {
            updateParticipants()
          })
          .on(RoomEvent.LocalTrackPublished, (publication: LocalTrackPublication) => {
            log('Local track published:', publication.kind)

            if (publication.source === Track.Source.ScreenShare) {
              const systemMessage: ChatMessage = {
                id: `system-screenshare-start-${Date.now()}-local`,
                participantIdentity: 'system',
                participantName: 'System',
                message: 'You started sharing your screen',
                timestamp: Date.now(),
                isLocal: false,
                isSystem: true,
              }
              setChatMessages(prev => [...prev, systemMessage])
            }
            updateParticipants()
          })
          .on(RoomEvent.LocalTrackUnpublished, (publication: LocalTrackPublication) => {
            log('Local track unpublished:', publication.kind)

            if (publication.source === Track.Source.ScreenShare) {
              const systemMessage: ChatMessage = {
                id: `system-screenshare-stop-${Date.now()}-local`,
                participantIdentity: 'system',
                participantName: 'System',
                message: 'You stopped sharing your screen',
                timestamp: Date.now(),
                isLocal: false,
                isSystem: true,
              }
              setChatMessages(prev => [...prev, systemMessage])
            }
            updateParticipants()
          })
          .on(RoomEvent.Disconnected, reason => {
            log('Disconnected from room, reason:', String(reason))
            isConnectingRef.current = false
            isDisconnectingRef.current = false
            setIsConnected(false)
            const reasonNum = typeof reason === 'number' ? reason : -1
            if (reasonNum !== 0) {
              log('Calling onDisconnected callback')
              onDisconnected?.()
            } else {
              log('Connection failed, NOT calling onDisconnected (ICE error)')
            }
          })
          .on(RoomEvent.Reconnecting, () => {
            log('Reconnecting...')
          })
          .on(RoomEvent.Reconnected, () => {
            log('Reconnected')
            updateParticipants()
          })
          .on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
            log('Connection quality changed:', quality, participant.identity)
          })
          .on(
            RoomEvent.TrackPublished,
            (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
              log('Remote track published:', publication.source, participant.identity)

              if (
                publication.source === Track.Source.ScreenShare &&
                participant.identity !== room.localParticipant.identity
              ) {
                const systemMessage: ChatMessage = {
                  id: `system-screenshare-start-${Date.now()}-${participant.identity}`,
                  participantIdentity: 'system',
                  participantName: 'System',
                  message: `${participant.name || participant.identity} started sharing their screen`,
                  timestamp: Date.now(),
                  isLocal: false,
                  isSystem: true,
                }
                setChatMessages(prev => [...prev, systemMessage])
              }
              updateParticipants()
            }
          )
          .on(
            RoomEvent.TrackUnpublished,
            (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
              log('Remote track unpublished:', publication.source, participant.identity)

              if (
                publication.source === Track.Source.ScreenShare &&
                participant.identity !== room.localParticipant.identity
              ) {
                const systemMessage: ChatMessage = {
                  id: `system-screenshare-stop-${Date.now()}-${participant.identity}`,
                  participantIdentity: 'system',
                  participantName: 'System',
                  message: `${participant.name || participant.identity} stopped sharing their screen`,
                  timestamp: Date.now(),
                  isLocal: false,
                  isSystem: true,
                }
                setChatMessages(prev => [...prev, systemMessage])
              }
              updateParticipants()
            }
          )
          .on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
            const decoder = new TextDecoder()
            const data = decoder.decode(payload)

            log('📦 Data received:', {
              topic,
              participant: participant?.identity,
              kind,
              dataLength: data.length,
            })

            if (topic === 'lk.transcription') {
              try {
                const transcriptionData = JSON.parse(data)
                log('📝 Transcription data parsed:', transcriptionData)

                const speakerIdentity = transcriptionData.participant_identity

                const room = roomRef.current
                let speakerName = 'Unknown'

                if (room) {
                  if (speakerIdentity === room.localParticipant.identity) {
                    speakerName = room.localParticipant.name || 'You'
                  } else {
                    const speakerParticipant = room.remoteParticipants.get(speakerIdentity)
                    if (speakerParticipant) {
                      speakerName = speakerParticipant.name || speakerParticipant.identity
                    }
                  }
                }

                const transcription: Transcription = {
                  id: `${Date.now()}-${speakerIdentity}`,
                  participantIdentity: speakerIdentity,
                  participantName: speakerName,
                  text: transcriptionData.text || data,
                  isFinal: transcriptionData.final === true,
                  timestamp: Date.now(),
                }

                log('✅ Transcription created:', {
                  id: transcription.id,
                  speaker: speakerName,
                  text: transcription.text.substring(0, 100),
                  isFinal: transcription.isFinal,
                })

                setTranscriptions(prev => {
                  const filtered = prev.filter(t => t.id !== transcription.id)
                  const newTranscriptions = [...filtered, transcription]
                  log('📊 Transcriptions state updated. Total:', newTranscriptions.length)
                  return newTranscriptions
                })
                return
              } catch (err) {
                logError('❌ Failed to parse transcription data:', err)
              }
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === 'chat') {
                const chatMessage: ChatMessage = {
                  id: `${Date.now()}-${participant?.identity || 'unknown'}`,
                  participantIdentity: participant?.identity || 'unknown',
                  participantName: participant?.identity || 'Unknown',
                  message: parsed.message,
                  timestamp: Date.now(),
                  isLocal: false,
                }
                log('Chat message received:', chatMessage)
                setChatMessages(prev => [...prev, chatMessage])
              }
            } catch (err) {
              logError('Failed to parse data packet:', err)
            }
          })

        log('Connecting to LiveKit server...')
        await room.connect(serverUrl, token)
        log('✓ Connected to room:', room.name)

        roomRef.current = room
        isConnectingRef.current = false
        setIsConnected(true)
        setIsConnecting(false)
        updateParticipants()
      } catch (err) {
        logError('Failed to connect to room:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect to room'
        setError(errorMessage)
        onError?.(err instanceof Error ? err : new Error(errorMessage))
        isConnectingRef.current = false
        setIsConnecting(false)
        setIsConnected(false)
      }
    },
    [serverUrl, onDisconnected, onError, updateParticipants]
  )

  const disconnect = useCallback(async () => {
    if (isDisconnectingRef.current) {
      log('Already disconnecting, skipping...')
      return
    }

    const room = roomRef.current
    if (!room) {
      log('No room to disconnect from')
      return
    }

    try {
      log('Disconnecting from room...')
      isDisconnectingRef.current = true
      await room.disconnect()
      log('✓ Disconnected successfully')
      roomRef.current = null
      setIsConnected(false)
      setParticipants(new Map())
      setLocalVideoTrack(null)
      setLocalAudioTrack(null)
      setIsCameraEnabled(false)
      setIsMicrophoneEnabled(false)
    } catch (err) {
      logError('Failed to disconnect:', err)
    } finally {
      isDisconnectingRef.current = false
      isConnectingRef.current = false
    }
  }, [])

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current
    if (!room) {
      logError('Cannot toggle camera: no room')
      return
    }

    try {
      const enabled = !isCameraEnabled
      log('Toggling camera:', enabled ? 'ON' : 'OFF')
      await room.localParticipant.setCameraEnabled(enabled)
      setIsCameraEnabled(enabled)
      log('✓ Camera toggled successfully')

      if (enabled) {
        const publication = room.localParticipant.getTrackPublication(Track.Source.Camera)
        if (publication?.track instanceof LocalVideoTrack) {
          setLocalVideoTrack(publication.track)
        }
      } else {
        setLocalVideoTrack(null)
      }

      updateParticipants()
    } catch (err) {
      logError('Failed to toggle camera:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle camera'
      setError(errorMessage)
    }
  }, [isCameraEnabled, updateParticipants])

  const toggleMicrophone = useCallback(async () => {
    const room = roomRef.current
    if (!room) {
      logError('Cannot toggle microphone: no room')
      return
    }

    try {
      const enabled = !isMicrophoneEnabled
      log('Toggling microphone:', enabled ? 'ON' : 'OFF')
      await room.localParticipant.setMicrophoneEnabled(enabled)
      setIsMicrophoneEnabled(enabled)
      log('✓ Microphone toggled successfully')

      if (enabled) {
        const publication = room.localParticipant.getTrackPublication(Track.Source.Microphone)
        if (publication?.track instanceof LocalAudioTrack) {
          setLocalAudioTrack(publication.track)
        }
      } else {
        setLocalAudioTrack(null)
      }

      updateParticipants()
    } catch (err) {
      logError('Failed to toggle microphone:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle microphone'
      setError(errorMessage)
    }
  }, [isMicrophoneEnabled, updateParticipants])

  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current
    if (!room) {
      logError('Cannot toggle screen share: no room')
      return
    }

    try {
      const isSharing = room.localParticipant.isScreenShareEnabled
      log('Toggling screen share:', !isSharing ? 'ON' : 'OFF')
      await room.localParticipant.setScreenShareEnabled(!isSharing)
      log('✓ Screen share toggled successfully')
      updateParticipants()
    } catch (err) {
      logError('Failed to toggle screen share:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle screen share'
      setError(errorMessage)
    }
  }, [updateParticipants])

  const toggleTranscription = useCallback(async () => {
    const room = roomRef.current
    if (!room) {
      logError('Cannot toggle transcription: no room')
      return
    }

    try {
      const newState = !isTranscriptionEnabled
      log('🎙️ Toggling transcription:', newState ? 'ON' : 'OFF')

      setIsTranscriptionEnabled(newState)

      const roomName = room.name
      const endpoint = newState ? `/api/stt/join/${roomName}` : `/api/stt/leave/${roomName}`

      log(`📡 ${newState ? 'Starting' : 'Stopping'} STT agent for room: ${roomName}`)

      try {
        const response = await fetch(`http://localhost:8000${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`STT agent ${newState ? 'join' : 'leave'} failed`)
        }

        const result = await response.json()
        log('✓ STT agent response:', result)
      } catch (apiErr) {
        logError('STT agent API error:', apiErr)
      }

      const encoder = new TextEncoder()
      const data = encoder.encode(
        JSON.stringify({
          type: 'transcription_state',
          enabled: newState,
          timestamp: Date.now(),
        })
      )

      await room.localParticipant.publishData(data, {
        reliable: true,
      })

      log('✓ Transcription toggled successfully')
      if (newState) {
        log('🎤 STT agent will transcribe audio and publish to lk.transcription stream')
      }
    } catch (err) {
      logError('Failed to toggle transcription:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle transcription'
      setError(errorMessage)
    }
  }, [isTranscriptionEnabled])

  const getVideoElement = useCallback(
    (identity: string, _isScreenShare = false): HTMLVideoElement | null => {
      const room = roomRef.current
      if (!room) return null

      if (identity.endsWith('_screen')) {
        const actualIdentity = identity.replace('_screen', '')

        if (actualIdentity === room.localParticipant.identity) {
          const screenPublication = room.localParticipant.getTrackPublication(
            Track.Source.ScreenShare
          )
          if (screenPublication?.track) {
            const element = screenPublication.track.attach()
            return element as HTMLVideoElement
          }
        } else {
          const participant = room.remoteParticipants.get(actualIdentity)
          if (participant) {
            const screenPublication = participant.getTrackPublication(Track.Source.ScreenShare)
            if (screenPublication?.track) {
              const element = screenPublication.track.attach()
              return element as HTMLVideoElement
            }
          }
        }
      } else {
        if (identity === room.localParticipant.identity) {
          const videoPublication = room.localParticipant.getTrackPublication(Track.Source.Camera)
          if (videoPublication?.track) {
            const element = videoPublication.track.attach()
            return element as HTMLVideoElement
          }
        } else {
          const participant = room.remoteParticipants.get(identity)
          if (participant) {
            const videoPublication = participant.getTrackPublication(Track.Source.Camera)
            if (videoPublication?.track) {
              const element = videoPublication.track.attach()
              return element as HTMLVideoElement
            }
          }
        }
      }

      return null
    },
    []
  )

  const getAudioElement = useCallback((identity: string): HTMLAudioElement | null => {
    const room = roomRef.current
    if (!room) return null

    if (identity === room.localParticipant.identity) {
      return null
    }

    const participant = room.remoteParticipants.get(identity)
    if (participant) {
      const audioPublication = participant.getTrackPublication(Track.Source.Microphone)
      if (audioPublication?.track) {
        const element = audioPublication.track.attach()
        return element as HTMLAudioElement
      }
    }

    return null
  }, [])

  useEffect(() => {
    return () => {
      log('Component unmounting, cleaning up...')
      if (roomRef.current && !isDisconnectingRef.current) {
        log('Force disconnecting room on unmount')
        roomRef.current.disconnect()
      }
    }
  }, [])

  return {
    room: roomRef.current,
    isConnecting,
    isConnected,
    participants: Array.from(participants.values()),
    localVideoTrack,
    localAudioTrack,
    isCameraEnabled,
    isMicrophoneEnabled,
    isTranscriptionEnabled,
    error,
    connect,
    disconnect,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    toggleTranscription,
    getVideoElement,
    getAudioElement,
    chatMessages,
    bookmarks,
    transcriptions,
    roomCreatedAt,
    setRoomCreatedAt,
    addSystemMessage: useCallback((message: string) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        participantIdentity: 'system',
        participantName: 'System',
        message,
        timestamp: Date.now(),
        isLocal: false,
        isSystem: true,
      }
      setChatMessages(prev => [...prev, systemMessage])
    }, []),
    addBookmark: useCallback(
      (message: string) => {
        if (!roomCreatedAt) return

        const roomStartTime = new Date(roomCreatedAt).getTime()
        const currentTime = Date.now()
        const meetingElapsed = Math.floor((currentTime - roomStartTime) / 1000)

        const bookmark: Bookmark = {
          id: `bookmark-${Date.now()}`,
          timestamp: currentTime,
          meetingTime: meetingElapsed,
          message,
          createdAt: currentTime,
        }

        setBookmarks(prev => [...prev, bookmark])
        log('Bookmark added:', bookmark)
        return bookmark
      },
      [roomCreatedAt]
    ),
    sendChatMessage: useCallback(
      async (message: string) => {
        const room = roomRef.current
        if (!room) {
          logError('Cannot send chat: no room')
          return
        }

        try {
          if (message.startsWith('/')) {
            const [command, ...args] = message.slice(1).split(' ')
            const commandLower = command.toLowerCase()

            if (commandLower === 'help') {
              const helpMessage = `Available commands:
/help - Show this help message
/bookmark <message> - Save a timestamped bookmark
/bookmarks - List all your bookmarks

Commands are private and only visible to you.`

              const systemMessage: ChatMessage = {
                id: `system-${Date.now()}`,
                participantIdentity: 'system',
                participantName: 'System',
                message: helpMessage,
                timestamp: Date.now(),
                isLocal: false,
                isSystem: true,
              }
              setChatMessages(prev => [...prev, systemMessage])
              return
            } else if (commandLower === 'bookmark') {
              const bookmarkMessage = args.join(' ') || 'Bookmark'

              if (!roomCreatedAt) {
                const systemMessage: ChatMessage = {
                  id: `system-${Date.now()}`,
                  participantIdentity: 'system',
                  participantName: 'System',
                  message: 'Cannot create bookmark: room time not initialized',
                  timestamp: Date.now(),
                  isLocal: false,
                  isSystem: true,
                }
                setChatMessages(prev => [...prev, systemMessage])
                return
              }

              const roomStartTime = new Date(roomCreatedAt).getTime()
              const currentTime = Date.now()
              const meetingElapsed = Math.floor((currentTime - roomStartTime) / 1000)
              const minutes = Math.floor(meetingElapsed / 60)
              const seconds = meetingElapsed % 60
              const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

              const bookmark: Bookmark = {
                id: `bookmark-${Date.now()}`,
                timestamp: currentTime,
                meetingTime: meetingElapsed,
                message: bookmarkMessage,
                createdAt: currentTime,
              }

              setBookmarks(prev => [...prev, bookmark])

              const systemMessage: ChatMessage = {
                id: `system-${Date.now()}`,
                participantIdentity: 'system',
                participantName: 'System',
                message: `✓ Bookmark saved at ${timeString}: "${bookmarkMessage}"`,
                timestamp: Date.now(),
                isLocal: false,
                isSystem: true,
              }
              setChatMessages(prev => [...prev, systemMessage])
              log('Bookmark created:', bookmark)
              return
            } else if (commandLower === 'bookmarks') {
              if (bookmarks.length === 0) {
                const systemMessage: ChatMessage = {
                  id: `system-${Date.now()}`,
                  participantIdentity: 'system',
                  participantName: 'System',
                  message: 'No bookmarks yet. Use /bookmark <message> to create one.',
                  timestamp: Date.now(),
                  isLocal: false,
                  isSystem: true,
                }
                setChatMessages(prev => [...prev, systemMessage])
                return
              }

              const bookmarkList = bookmarks
                .map((b, idx) => {
                  const minutes = Math.floor(b.meetingTime / 60)
                  const seconds = b.meetingTime % 60
                  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
                  return `${idx + 1}. [${timeString}] ${b.message}`
                })
                .join('\n')

              const systemMessage: ChatMessage = {
                id: `system-${Date.now()}`,
                participantIdentity: 'system',
                participantName: 'System',
                message: `Your bookmarks:\n${bookmarkList}`,
                timestamp: Date.now(),
                isLocal: false,
                isSystem: true,
              }
              setChatMessages(prev => [...prev, systemMessage])
              return
            } else {
              const systemMessage: ChatMessage = {
                id: `system-${Date.now()}`,
                participantIdentity: 'system',
                participantName: 'System',
                message: `Unknown command: /${command}\nType /help for available commands.`,
                timestamp: Date.now(),
                isLocal: false,
                isSystem: true,
              }
              setChatMessages(prev => [...prev, systemMessage])
              return
            }
          }

          const chatData = JSON.stringify({
            type: 'chat',
            message,
            timestamp: Date.now(),
          })

          const encoder = new TextEncoder()
          const data = encoder.encode(chatData)

          await room.localParticipant.publishData(data, {
            reliable: true,
            destinationIdentities: [],
          })

          const chatMessage: ChatMessage = {
            id: `${Date.now()}-${room.localParticipant.identity}`,
            participantIdentity: room.localParticipant.identity,
            participantName: room.localParticipant.name || 'You',
            message,
            timestamp: Date.now(),
            isLocal: true,
          }

          log('Chat message sent:', chatMessage)
          setChatMessages(prev => [...prev, chatMessage])
        } catch (err) {
          logError('Failed to send chat message:', err)
          throw err
        }
      },
      [roomCreatedAt, bookmarks]
    ),
  }
}
