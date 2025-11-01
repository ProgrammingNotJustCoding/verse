import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteAudioTrack,
  AudioStream,
} from '@livekit/rtc-node'
import type { Logger } from 'pino'

interface STTAgentConfig {
  livekitUrl: string
  livekitApiKey: string
  livekitApiSecret: string
  whisperUrl: string
  logger: Logger
}

interface RoomSession {
  roomName: string
  room: Room
  audioBuffer: Buffer[]
  audioSubscriptions: Map<string, AudioSubscription>
  processingInterval: NodeJS.Timeout | null
}

interface AudioSubscription {
  participantIdentity: string
  participantName: string
  track: RemoteAudioTrack
}

interface WhisperResponse {
  text: string
  language?: string
}

export class LiveKitSTTAgent {
  private config: STTAgentConfig
  private sessions: Map<string, RoomSession> = new Map()
  private isRunning = false

  constructor(config: STTAgentConfig) {
    this.config = config
  }

  async start() {
    if (this.isRunning) {
      this.config.logger.warn('STT Agent already running')
      return
    }

    this.isRunning = true
    this.config.logger.info('🎙️  LiveKit STT Agent started')
    this.config.logger.info(`   LiveKit: ${this.config.livekitUrl}`)
    this.config.logger.info(`   Whisper: ${this.config.whisperUrl}`)
    this.config.logger.info('✓ Ready to transcribe audio from rooms')
  }

  async stop() {
    if (!this.isRunning) return

    this.isRunning = false
    this.config.logger.info('Stopping STT Agent...')

    for (const [roomName] of this.sessions.entries()) {
      await this.leaveRoom(roomName)
    }
    this.sessions.clear()

    this.config.logger.info('✓ STT Agent stopped')
  }

  async joinRoom(roomName: string, participantIdentity: string = 'stt-agent') {
    if (this.sessions.has(roomName)) {
      this.config.logger.warn({ roomName }, 'Already in room')
      return
    }

    this.config.logger.info({ roomName }, 'Joining room for transcription')

    try {
      const { AccessToken } = await import('livekit-server-sdk')
      const token = new AccessToken(this.config.livekitApiKey, this.config.livekitApiSecret, {
        identity: participantIdentity,
        name: 'Transcription Agent',
      })
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
      })
      const jwt = await token.toJwt()

      // Connect to room
      const room = new Room()
      const session: RoomSession = {
        roomName,
        room,
        audioBuffer: [],
        audioSubscriptions: new Map(),
        processingInterval: null,
      }

      this.sessions.set(roomName, session)

      // Set up room event handlers
      this.setupRoomHandlers(session)

      // Connect to LiveKit
      await room.connect(this.config.livekitUrl, jwt)

      this.config.logger.info({ roomName }, 'Connected to room')

      // Subscribe to existing participant tracks
      await this.subscribeToExistingTracks(session)

      // Start audio processing loop
      this.startAudioProcessing(session)

      this.config.logger.info({ roomName }, '✓ STT Agent fully initialized and ready')
    } catch (err) {
      this.config.logger.error({ err, roomName }, 'Failed to join room')
      this.sessions.delete(roomName)
      throw err
    }
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomName: string) {
    const session = this.sessions.get(roomName)
    if (!session) {
      this.config.logger.warn({ roomName }, 'Not in room')
      return
    }

    this.config.logger.info({ roomName }, 'Leaving room')

    // Stop audio processing
    if (session.processingInterval) {
      clearInterval(session.processingInterval)
      session.processingInterval = null
    }

    // Disconnect from room
    await session.room.disconnect()

    // Clear buffers and subscriptions
    session.audioBuffer = []
    session.audioSubscriptions.clear()

    this.sessions.delete(roomName)
    this.config.logger.info({ roomName }, 'Left room')
  }

  /**
   * Subscribe to audio tracks from existing participants
   */
  private async subscribeToExistingTracks(session: RoomSession) {
    const { room } = session

    this.config.logger.info(
      { roomName: session.roomName, participantCount: room.remoteParticipants.size },
      'Subscribing to existing participant tracks'
    )

    for (const [identity, participant] of room.remoteParticipants) {
      this.config.logger.info(
        { roomName: session.roomName, participantIdentity: identity },
        'Found remote participant'
      )

      for (const [trackSid, publication] of participant.trackPublications) {
        if (publication.kind === 1) {
          this.config.logger.info(
            {
              roomName: session.roomName,
              participantIdentity: identity,
              trackSid,
            },
            'Subscribing to audio track'
          )

          try {
            // Subscribe to the track
            publication.setSubscribed(true)
          } catch (err) {
            this.config.logger.error(
              { err, roomName: session.roomName, participantIdentity: identity },
              'Failed to subscribe to audio track'
            )
          }
        }
      }
    }
  }

  /**
   * Set up room event handlers
   */
  private setupRoomHandlers(session: RoomSession) {
    const { room } = session

    // Handle track subscribed
    room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
      this.config.logger.info(
        {
          roomName: session.roomName,
          participantIdentity: participant.identity,
          trackKind: track.kind,
          trackKindType: typeof track.kind,
        },
        'Track subscribed event received'
      )

      // track.kind is a number: 0=unknown, 1=audio, 2=video
      if (track.kind === 1) {
        this.handleAudioTrack(session, track as RemoteAudioTrack, participant)
      }
    })

    // Handle track unsubscribed
    room.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
      this.config.logger.info(
        {
          roomName: session.roomName,
          participantIdentity: participant.identity,
          trackKind: track.kind,
        },
        'Track unsubscribed'
      )

      if (track.kind === 1) {
        session.audioSubscriptions.delete(participant.identity)
      }
    })

    // Handle participant disconnected
    room.on(RoomEvent.ParticipantDisconnected, participant => {
      this.config.logger.info(
        {
          roomName: session.roomName,
          participantIdentity: participant.identity,
        },
        'Participant disconnected'
      )
      session.audioSubscriptions.delete(participant.identity)
    })

    // Handle disconnected
    room.on(RoomEvent.Disconnected, () => {
      this.config.logger.info({ roomName: session.roomName }, 'Disconnected from room')
      this.sessions.delete(session.roomName)
    })
  }

  /**
   * Handle audio track from participant
   */
  private async handleAudioTrack(
    session: RoomSession,
    track: RemoteAudioTrack,
    participant: RemoteParticipant
  ) {
    this.config.logger.info(
      {
        roomName: session.roomName,
        participantIdentity: participant.identity,
        participantName: participant.name,
      },
      '🎵 Processing audio track - setting up subscription'
    )

    const subscription: AudioSubscription = {
      participantIdentity: participant.identity,
      participantName: participant.name || participant.identity,
      track,
    }

    session.audioSubscriptions.set(participant.identity, subscription)

    this.config.logger.info(
      { roomName: session.roomName, participantIdentity: participant.identity },
      '✓ Audio subscription created, starting frame processing'
    )

    // Process audio frames
    this.processAudioFrames(session, subscription)
  }

  /**
   * Process audio frames and send to Whisper
   */
  private async processAudioFrames(session: RoomSession, subscription: AudioSubscription) {
    const { track, participantIdentity } = subscription

    this.config.logger.info(
      { roomName: session.roomName, participantIdentity },
      '📡 Starting audio frame processing task in background'
    )

    // Start processing in background
    this.readAudioFrames(session, track, participantIdentity).catch(err => {
      this.config.logger.error(
        { err, roomName: session.roomName, participantIdentity },
        '❌ Error in audio frame processing loop'
      )
    })
  }

  /**
   * Read audio frames from track (background task)
   */
  private async readAudioFrames(
    session: RoomSession,
    track: RemoteAudioTrack,
    participantIdentity: string
  ) {
    try {
      // Create audio stream from track
      const audioStream = new AudioStream(track)

      this.config.logger.info(
        { roomName: session.roomName, participantIdentity },
        '🎧 Audio stream created, starting to read frames...'
      )

      let frameCount = 0
      let totalBytes = 0

      // Read frames using async iterator
      for await (const frame of audioStream) {
        frameCount++
        const pcmData = Buffer.from(frame.data.buffer)
        totalBytes += pcmData.length

        if (frameCount === 1) {
          this.config.logger.info(
            {
              roomName: session.roomName,
              participantIdentity,
              firstFrameSize: pcmData.length,
            },
            '🎤 First audio frame received!'
          )
        }

        if (frameCount % 50 === 0) {
          this.config.logger.info(
            {
              roomName: session.roomName,
              participantIdentity,
              frameCount,
              totalBytes,
              bufferLength: session.audioBuffer.length,
            },
            '📊 Audio frames being processed'
          )
        }

        try {
          // Add to buffer for periodic Whisper processing
          session.audioBuffer.push(pcmData)
        } catch (err) {
          this.config.logger.error({ err }, '❌ Error buffering frame')
        }
      }

      this.config.logger.info(
        { roomName: session.roomName, participantIdentity },
        'Audio stream ended'
      )
    } catch (err) {
      this.config.logger.error(
        { err, roomName: session.roomName, participantIdentity },
        'Error reading audio frames'
      )
    }
  }

  /**
   * Start periodic audio processing and transcription
   */
  private startAudioProcessing(session: RoomSession) {
    // Process audio buffer every 3 seconds
    session.processingInterval = setInterval(async () => {
      const bufferLength = session.audioBuffer.length

      this.config.logger.debug(
        { roomName: session.roomName, bufferLength },
        '⏰ Audio processing interval tick'
      )

      if (bufferLength === 0) {
        this.config.logger.debug({ roomName: session.roomName }, 'No audio in buffer, skipping')
        return
      }

      try {
        // Combine buffered audio chunks
        const audioData = Buffer.concat(session.audioBuffer)
        session.audioBuffer = []

        this.config.logger.info(
          { roomName: session.roomName, audioDataSize: audioData.length },
          '🔄 Processing buffered audio'
        )

        if (audioData.length < 16000) {
          this.config.logger.debug(
            { roomName: session.roomName, size: audioData.length },
            'Audio buffer too small (< 1 sec), skipping'
          )
          return
        }

        // Send to Whisper HTTP API
        await this.transcribeAudio(session, audioData)
      } catch (err) {
        this.config.logger.error(
          { err, roomName: session.roomName },
          '❌ Error processing audio buffer'
        )
      }
    }, 3000)

    this.config.logger.info(
      { roomName: session.roomName },
      '✓ Started audio processing interval (3s)'
    )
  }

  /**
   * Send audio to Whisper HTTP API for transcription
   */
  private async transcribeAudio(session: RoomSession, audioData: Buffer): Promise<void> {
    try {
      const FormData = (await import('form-data')).default
      const form = new FormData()

      // Convert PCM to WAV format (48000 Hz from LiveKit, will be downsampled by Whisper)
      const wavBuffer = this.pcmToWav(audioData, 48000, 1, 16)

      this.config.logger.info(
        { roomName: session.roomName, wavSize: wavBuffer.length },
        'Sending WAV to Whisper'
      )

      form.append('audio_file', wavBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav',
      })
      form.append('task', 'transcribe')
      form.append('language', 'en')
      form.append('output', 'json')

      const response = await fetch(`${this.config.whisperUrl}/asr?encode=false&output=json`, {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: form as any,
        headers: form.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.config.logger.error(
          {
            roomName: session.roomName,
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
          },
          'Whisper API returned error'
        )
        throw new Error(`Whisper API error: ${response.status} ${response.statusText}`)
      }

      const result: WhisperResponse = await response.json()
      await this.handleTranscription(session, result)
    } catch (err) {
      this.config.logger.error({ err, roomName: session.roomName }, 'Error transcribing audio')
    }
  }

  /**
   * Convert PCM data to WAV format
   */
  private pcmToWav(
    pcmData: Buffer,
    sampleRate: number,
    channels: number,
    bitDepth: number
  ): Buffer {
    // Convert Float32 PCM to Int16 PCM if needed
    // LiveKit provides float32 samples, Whisper expects int16
    let int16Data: Buffer

    if (pcmData.length % 4 === 0) {
      // Assume float32 data (4 bytes per sample)
      const float32Array = new Float32Array(pcmData.buffer, pcmData.byteOffset, pcmData.length / 4)
      const int16Array = new Int16Array(float32Array.length)

      for (let i = 0; i < float32Array.length; i++) {
        // Clamp and convert float [-1, 1] to int16 [-32768, 32767]
        const s = Math.max(-1, Math.min(1, float32Array[i]))
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }

      int16Data = Buffer.from(int16Array.buffer)
    } else {
      // Already int16 data
      int16Data = pcmData
    }

    const blockAlign = channels * 2 // 2 bytes per sample for int16
    const byteRate = sampleRate * blockAlign
    const dataSize = int16Data.length
    const headerSize = 44
    const fileSize = headerSize + dataSize - 8

    const header = Buffer.alloc(headerSize)

    // RIFF header
    header.write('RIFF', 0)
    header.writeUInt32LE(fileSize, 4)
    header.write('WAVE', 8)

    // fmt chunk
    header.write('fmt ', 12)
    header.writeUInt32LE(16, 16) // fmt chunk size
    header.writeUInt16LE(1, 20) // PCM format
    header.writeUInt16LE(channels, 22)
    header.writeUInt32LE(sampleRate, 24)
    header.writeUInt32LE(byteRate, 28)
    header.writeUInt16LE(blockAlign, 32)
    header.writeUInt16LE(16, 34) // 16-bit depth

    // data chunk
    header.write('data', 36)
    header.writeUInt32LE(dataSize, 40)

    return Buffer.concat([header, int16Data])
  }

  /**
   * Handle transcription from Whisper
   */
  private async handleTranscription(session: RoomSession, result: WhisperResponse) {
    try {
      const { text } = result

      if (!text || text.trim().length === 0) {
        return
      }

      this.config.logger.info(
        {
          roomName: session.roomName,
          text: text.substring(0, 50),
        },
        'Transcription received'
      )

      // Publish transcription to room via data channel
      const transcriptionData = {
        type: 'lk.transcription',
        text,
        isFinal: true,
        timestamp: Date.now(),
      }

      const encoder = new TextEncoder()
      const data = encoder.encode(JSON.stringify(transcriptionData))

      await session.room.localParticipant?.publishData(data, {
        reliable: true,
      })

      this.config.logger.debug({ roomName: session.roomName }, 'Transcription published to room')
    } catch (err) {
      this.config.logger.error({ err, roomName: session.roomName }, 'Error handling transcription')
    }
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys())
  }

  /**
   * Check if monitoring a room
   */
  isMonitoringRoom(roomName: string): boolean {
    return this.sessions.has(roomName)
  }
}

/**
 * Create STT agent instance
 */
export function createSTTAgent(config: STTAgentConfig): LiveKitSTTAgent {
  return new LiveKitSTTAgent(config)
}
