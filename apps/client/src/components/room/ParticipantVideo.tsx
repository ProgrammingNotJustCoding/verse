import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, User, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RemoteTrack } from 'livekit-client'

interface ParticipantVideoProps {
  identity: string
  name: string
  videoTrack?: RemoteTrack | MediaStreamTrack
  audioTrack?: RemoteTrack | MediaStreamTrack
  screenShareTrack?: RemoteTrack | MediaStreamTrack
  isSpeaking?: boolean
  isMuted?: boolean
  isVideoOff?: boolean
  isLocal?: boolean
  isScreenShare?: boolean
  getVideoElement?: () => HTMLVideoElement | null
  getAudioElement?: () => HTMLAudioElement | null
}

export function ParticipantVideo({
  identity: _identity,
  name,
  videoTrack: _videoTrack,
  audioTrack,
  screenShareTrack: _screenShareTrack,
  isSpeaking = false,
  isMuted = false,
  isVideoOff: _isVideoOff = false,
  isLocal = false,
  isScreenShare = false,
  getVideoElement,
  getAudioElement,
}: ParticipantVideoProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLDivElement>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const [hasVideoElement, setHasVideoElement] = useState(false)

  useEffect(() => {
    if (!videoRef.current) return

    if (videoElementRef.current) {
      videoElementRef.current.remove()
      videoElementRef.current = null
      setHasVideoElement(false)
    }

    if (getVideoElement) {
      try {
        const videoElement = getVideoElement()
        if (videoElement) {
          videoElement.className = 'h-full w-full object-cover'
          videoElement.autoplay = true
          videoElement.playsInline = true
          videoElement.muted = isLocal

          if (isLocal && !_screenShareTrack) {
            videoElement.style.transform = 'scaleX(-1)'
          }

          videoRef.current.appendChild(videoElement)
          videoElementRef.current = videoElement
          setHasVideoElement(true)

          videoElement.play().catch((err: Error) => {
            console.warn('Failed to play video:', err)
          })
        }
      } catch (err) {
        console.error('Error attaching video element:', err)
      }
    }

    return () => {
      if (videoElementRef.current) {
        videoElementRef.current.pause()
        videoElementRef.current.srcObject = null
        videoElementRef.current.remove()
        videoElementRef.current = null
        setHasVideoElement(false)
      }
    }
  }, [_videoTrack, _screenShareTrack, getVideoElement, isLocal])

  useEffect(() => {
    if (!audioRef.current || isLocal) return

    if (audioElementRef.current) {
      audioElementRef.current.remove()
      audioElementRef.current = null
    }

    if (getAudioElement && audioTrack) {
      try {
        const audioElement = getAudioElement()
        if (audioElement) {
          audioElement.autoplay = true

          audioRef.current.appendChild(audioElement)
          audioElementRef.current = audioElement

          audioElement.play().catch((err: Error) => {
            console.warn('Failed to play audio:', err)
          })
        }
      } catch (err) {
        console.error('Error attaching audio element:', err)
      }
    }

    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        audioElementRef.current.srcObject = null
        audioElementRef.current.remove()
        audioElementRef.current = null
      }
    }
  }, [audioTrack, getAudioElement, isLocal])

  return (
    <div
      className={cn(
        'relative aspect-video overflow-hidden rounded-lg',
        isScreenShare ? 'bg-slate-900' : 'bg-secondary',
        isSpeaking && 'ring-2 ring-primary'
      )}
    >
      {/* Video container */}
      <div ref={videoRef} className="h-full w-full">
        {!hasVideoElement && (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center',
              isScreenShare ? 'bg-slate-900' : 'bg-secondary'
            )}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              {isScreenShare ? (
                <Monitor className="h-8 w-8 text-primary" />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio container for remote participants */}
      <div ref={audioRef} className="hidden" />

      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            {name}
            {isLocal && ' (You)'}
          </span>
          <div className="flex items-center gap-1">
            {audioTrack ? (
              isMuted ? (
                <div className="rounded-full bg-red-500 p-1">
                  <MicOff className="h-3 w-3 text-white" />
                </div>
              ) : (
                <div className="rounded-full bg-green-500 p-1">
                  <Mic className="h-3 w-3 text-white" />
                </div>
              )
            ) : (
              <div className="rounded-full bg-red-500 p-1">
                <MicOff className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute left-2 top-2">
          <div className="flex h-2 w-2 animate-pulse items-center justify-center">
            <div className="h-full w-full rounded-full bg-green-500"></div>
          </div>
        </div>
      )}
    </div>
  )
}
