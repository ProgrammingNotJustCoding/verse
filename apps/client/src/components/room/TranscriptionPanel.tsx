import { useEffect, useRef } from 'react'
import { X, Subtitles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Transcription } from '@/hooks/useLiveKit'

interface TranscriptionPanelProps {
  transcriptions: Transcription[]
  onClose: () => void
}

export function TranscriptionPanel({ transcriptions, onClose }: TranscriptionPanelProps) {
  const lastTranscriptionRef = useRef<HTMLDivElement>(null)

  
  useEffect(() => {
    console.log('🎬 TranscriptionPanel rendered with', transcriptions.length, 'transcriptions')
    if (transcriptions.length > 0) {
      console.log('📝 Latest transcription:', transcriptions[transcriptions.length - 1])
    }
  }, [transcriptions])

  
  useEffect(() => {
    if (lastTranscriptionRef.current) {
      lastTranscriptionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [transcriptions])

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="flex h-full flex-col border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Subtitles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Live Transcription</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Transcriptions list */}
      <div className="flex-1 overflow-y-auto p-4">
        {transcriptions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <Subtitles className="mb-2 h-12 w-12 opacity-20" />
            <p className="text-sm">No transcriptions yet</p>
            <p className="mt-1 text-xs">Speech will be transcribed here in real-time</p>
            <p className="mt-3 text-xs text-orange-500">
              ⚠️ Requires LiveKit Agents with STT on backend
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Check console for debug logs</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transcriptions.map((transcription, index) => (
              <div
                key={transcription.id}
                ref={index === transcriptions.length - 1 ? lastTranscriptionRef : null}
                className={`rounded-lg border p-3 ${
                  transcription.isFinal ? 'bg-background' : 'border-primary/30 bg-primary/5'
                }`}
              >
                {/* Participant info */}
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">
                    {transcription.participantName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(transcription.timestamp)}
                  </span>
                </div>

                {/* Transcription text */}
                <p
                  className={`text-sm ${
                    transcription.isFinal ? 'text-foreground' : 'italic text-muted-foreground'
                  }`}
                >
                  {transcription.text}
                  {!transcription.isFinal && <span className="ml-1 animate-pulse">...</span>}
                </p>

                {/* Status indicator */}
                {!transcription.isFinal && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    <span>Interim</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="border-t bg-muted/30 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          {transcriptions.length > 0 ? (
            <>
              {transcriptions.filter(t => t.isFinal).length} final transcriptions
              {transcriptions.some(t => !t.isFinal) && ' • Processing...'}
            </>
          ) : (
            'Waiting for speech... (Check console logs)'
          )}
        </p>
      </div>
    </div>
  )
}
