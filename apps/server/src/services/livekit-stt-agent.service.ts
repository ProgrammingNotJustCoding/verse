import type { Logger } from 'pino'
import type { Database } from '../database/db.ts'
import { roomRepository } from '../database/repositories/rooms.repository.ts'

interface LiveKitSTTAgentOptions {
  db: Database
  logger: Logger
  whisperUrl: string
}

export class LiveKitSTTAgent {
  private db: Database
  private logger: Logger
  private whisperUrl: string
  private checkInterval: NodeJS.Timeout | null = null
  private activeRooms: Set<string> = new Set()

  constructor(options: LiveKitSTTAgentOptions) {
    this.db = options.db
    this.logger = options.logger
    this.whisperUrl = options.whisperUrl
  }

  async start() {
    this.logger.info('🎙️  LiveKit STT Agent service starting...')
    this.logger.info(`   Whisper server: ${this.whisperUrl}`)

    this.checkInterval = setInterval(() => {
      this.checkRooms().catch(err => {
        this.logger.error({ err }, 'Error checking rooms')
      })
    }, 30000)

    this.logger.info('✓ STT monitoring started')
    this.logger.warn('⚠️  To enable actual transcription:')
    this.logger.warn('   1. Run: cd docker/compose/whisper && ./setup.sh')
    this.logger.warn('   2. Run: cd docker && docker compose up whisper -d')
    this.logger.warn('   3. Deploy LiveKit Agents (see docker/compose/whisper/README.md)')
  }

  async stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.logger.info('STT monitoring stopped')
  }

  private async checkRooms() {
    try {
      const rooms = await roomRepository(this.db).getActiveRooms()

      for (const room of rooms) {
        if (!this.activeRooms.has(room.id)) {
          this.activeRooms.add(room.id)
          this.logger.info(
            { roomId: room.id, roomName: room.name },
            '📝 Room active - transcription available when enabled'
          )
        }
      }

      const activeRoomIds = new Set(rooms.map(r => r.id))
      for (const roomId of this.activeRooms) {
        if (!activeRoomIds.has(roomId)) {
          this.activeRooms.delete(roomId)
        }
      }
    } catch (err) {
      this.logger.error({ err }, 'Error checking rooms')
    }
  }
}

export function createLiveKitSTTAgent(options: LiveKitSTTAgentOptions): LiveKitSTTAgent {
  return new LiveKitSTTAgent(options)
}
