import { useEffect, useRef } from 'react'
import { Mic, MicOff, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RemoteTrack } from 'livekit-client'

interface ParticipantVideoProps {
  identity: string
  name: string
  videoTrack?: RemoteTrack
  audioTrack?: RemoteTrack
  isSpeaking?: boolean
  isMuted?: boolean
  isVideoOff?: boolean
  isLocal?: boolean
  getVideoElement?: () => HTMLVideoElement | null
}

export function ParticipantVideo({
  identity: _identity,
  name,
  videoTrack,
  audioTrack,
  isSpeaking = false,
  isMuted = false,
  isVideoOff: _isVideoOff = false,
  isLocal = false,
  getVideoElement,
}: ParticipantVideoProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!videoRef.current) return

    // Remove existing video element
    if (videoElementRef.current) {
      videoElementRef.current.remove()
      videoElementRef.current = null
    }

    // Get and attach new video element
    if (getVideoElement && videoTrack) {
      const videoElement = getVideoElement()
      if (videoElement) {
        videoElement.className = 'h-full w-full object-cover'
        if (isLocal) {
          videoElement.style.transform = 'scaleX(-1)' // Mirror local video
        }
        videoRef.current.appendChild(videoElement)
        videoElementRef.current = videoElement
      }
    }

    return () => {
      if (videoElementRef.current) {
        videoElementRef.current.remove()
        videoElementRef.current = null
      }
    }
  }, [videoTrack, getVideoElement, isLocal])

  return (
    <div
      className={cn(
        'relative aspect-video overflow-hidden rounded-lg bg-secondary',
        isSpeaking && 'ring-2 ring-primary'
      )}
    >
      {/* Video container */}
      <div ref={videoRef} className="h-full w-full">
        {!videoTrack && (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <User className="h-8 w-8 text-primary" />
            </div>
          </div>
        )}
      </div>

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
