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

// Debug logging helper
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
  screenShareIdentity?: string // The identity of the participant sharing
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
  const [error, setError] = useState<string | null>(null)

  // Update participants list
  const updateParticipants = useCallback(() => {
    const room = roomRef.current
    if (!room) return

    const participantMap = new Map<string, ParticipantInfo>()

    // Add local participant
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

    // Add local participant (camera)
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

    // Add local screen share as separate tile if sharing
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

    // Add remote participants
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

      // Add remote participant (camera)
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

      // Add remote screen share as separate tile if sharing
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

  // Connect to room
  const connect = useCallback(
    async (token: string) => {
      // Prevent multiple connections
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

        // Create room with optimal settings
        log('Creating Room instance...')
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
        })

        log('Server URL:', serverUrl)

        // Set up event listeners
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
            updateParticipants()
          })
          .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
            log('Participant disconnected:', participant.identity)
            updateParticipants()
          })
          .on(RoomEvent.ActiveSpeakersChanged, () => {
            updateParticipants()
          })
          .on(RoomEvent.LocalTrackPublished, (publication: LocalTrackPublication) => {
            log('Local track published:', publication.kind)
            updateParticipants()
          })
          .on(RoomEvent.LocalTrackUnpublished, (publication: LocalTrackPublication) => {
            log('Local track unpublished:', publication.kind)
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

        // Connect to room
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

  // Disconnect from room
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

  // Enable/disable camera
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

      // Update local video track reference
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

  // Enable/disable microphone
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

      // Update local audio track reference
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

  // Enable screen share
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

  // Get participant video element (camera or screen share)
  const getVideoElement = useCallback(
    (identity: string, _isScreenShare = false): HTMLVideoElement | null => {
      const room = roomRef.current
      if (!room) return null

      // Handle screen share tiles (identity ends with _screen)
      if (identity.endsWith('_screen')) {
        const actualIdentity = identity.replace('_screen', '')

        if (actualIdentity === room.localParticipant.identity) {
          // Local screen share
          const screenPublication = room.localParticipant.getTrackPublication(
            Track.Source.ScreenShare
          )
          if (screenPublication?.track) {
            const element = screenPublication.track.attach()
            return element as HTMLVideoElement
          }
        } else {
          // Remote screen share
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
        // Regular camera view
        if (identity === room.localParticipant.identity) {
          // Local participant camera
          const videoPublication = room.localParticipant.getTrackPublication(Track.Source.Camera)
          if (videoPublication?.track) {
            const element = videoPublication.track.attach()
            return element as HTMLVideoElement
          }
        } else {
          // Remote participant camera
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

  // Get participant audio element
  const getAudioElement = useCallback((identity: string): HTMLAudioElement | null => {
    const room = roomRef.current
    if (!room) return null

    // Don't attach audio for local participant (causes echo)
    if (identity === room.localParticipant.identity) {
      return null
    }

    // Remote participant
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

  // Cleanup on unmount
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
    error,
    connect,
    disconnect,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    getVideoElement,
    getAudioElement,
  }
}
