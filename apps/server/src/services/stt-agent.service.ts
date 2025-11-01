import { RoomServiceClient } from 'livekit-server-sdk'
import type { Logger } from 'pino'
import type { Database } from '../database/db.ts'
import { roomRepository } from '../database/repositories/rooms.repository.ts'

interface STTAgentOptions {
  db: Database
  logger: Logger
  livekitHost: string
  livekitApiKey: string
  livekitApiSecret: string
}

export class STTAgentService {
  private db: Database
  private logger: Logger
  private livekitClient: RoomServiceClient
  private livekitHost: string
  private livekitApiKey: string
  private livekitApiSecret: string
  private activeRooms: Map<string, boolean> = new Map()
  private checkInterval: NodeJS.Timeout | null = null

  constructor(options: STTAgentOptions) {
    this.db = options.db
    this.logger = options.logger
    this.livekitHost = options.livekitHost
    this.livekitApiKey = options.livekitApiKey
    this.livekitApiSecret = options.livekitApiSecret

    this.livekitClient = new RoomServiceClient(
      this.livekitHost,
      this.livekitApiKey,
      this.livekitApiSecret
    )
  }

  /**
   * Start monitoring rooms for transcription
   */
  async start() {
    this.logger.info('🎙️ STT Agent service starting...')

    
    
    

    this.checkInterval = setInterval(() => {
      this.checkActiveRooms().catch(err => {
        this.logger.error({ err }, 'Error checking active rooms for STT')
      })
    }, 30000) 

    this.logger.info(
      '✓ STT Agent service started (monitoring mode - deploy LiveKit Agents for full STT)'
    )
  }

  /**
   * Stop the STT agent service
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.logger.info('STT Agent service stopped')
  }

  /**
   * Check active rooms and log transcription status
   */
  private async checkActiveRooms() {
    try {
      
      const rooms = await roomRepository(this.db).getActiveRooms()

      for (const room of rooms) {
        try {
          
          const livekitRooms = await this.livekitClient.listRooms([room.name])

          if (livekitRooms.length > 0) {
            const livekitRoom = livekitRooms[0]

            if (!this.activeRooms.has(room.id)) {
              this.activeRooms.set(room.id, true)
              this.logger.info(
                {
                  roomId: room.id,
                  roomName: room.name,
                  numParticipants: livekitRoom.numParticipants,
                },
                '📝 Room active - STT would be available with LiveKit Agents'
              )
            }
          } else {
            
            if (this.activeRooms.has(room.id)) {
              this.activeRooms.delete(room.id)
            }
          }
        } catch (err) {
          this.logger.debug({ err, roomName: room.name }, 'Could not check LiveKit room')
        }
      }
    } catch (err) {
      this.logger.error({ err }, 'Error in checkActiveRooms')
    }
  }

  /**
   * Handle transcription request from a room
   * This would be called when a participant enables transcription
   */
  async handleTranscriptionRequest(
    roomName: string,
    participantIdentity: string,
    enabled: boolean
  ) {
    this.logger.info(
      {
        roomName,
        participantIdentity,
        enabled,
      },
      `Transcription ${enabled ? 'enabled' : 'disabled'} by participant`
    )

    
    
    
    
    
    

    
    this.logger.warn(
      '⚠️ To enable actual STT transcription, deploy LiveKit Agents with an STT provider'
    )
    this.logger.info(
      'See: https://docs.livekit.io/agents/quickstart/ and https://docs.livekit.io/agents/build/text/#transcriptions'
    )
  }
}

/**
 * Create STT agent service instance
 */
export function createSTTAgentService(options: STTAgentOptions): STTAgentService {
  return new STTAgentService(options)
}

/**
 * PRODUCTION SETUP INSTRUCTIONS:
 *
 * To enable real-time speech-to-text transcription:
 *
 * 1. Install LiveKit Agents SDK (Python recommended):
 *    pip install livekit-agents livekit-plugins-deepgram
 *
 * 2. Create an agent script (Python example):
 *
 *    from livekit import agents
 *    from livekit.agents import AgentSession, RoomInputOptions, RoomOutputOptions
 *    from livekit.plugins import deepgram
 *
 *    async def entrypoint(ctx: agents.JobContext):
 *        session = AgentSession(
 *            stt=deepgram.STT(),
 *            # ... other config
 *        )
 *        await session.start(
 *            agent=MyAgent(),
 *            room=ctx.room,
 *        )
 *
 * 3. Run the agent:
 *    python agent.py start
 *
 * 4. Agent will:
 *    - Connect to LiveKit rooms automatically
 *    - Subscribe to participant audio tracks
 *    - Send transcriptions to the 'lk.transcription' text stream
 *    - Frontend receives them via registerTextStreamHandler
 *
 * STT Providers supported:
 * - Deepgram (recommended, fast & accurate)
 * - AssemblyAI
 * - OpenAI Whisper
 * - Google Speech-to-Text
 * - Azure Speech
 */
