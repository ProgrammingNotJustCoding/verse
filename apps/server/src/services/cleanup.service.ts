import type { Database } from '../database/db.ts'
import { roomRepository } from '../database/repositories/rooms.repository.ts'
import { participantRepository } from '../database/repositories/participants.repository.ts'
import type { LivekitService } from './livekit.service.ts'
import type { Logger } from 'pino'

interface CleanupServiceOptions {
  db: Database
  livekit: LivekitService
  logger: Logger
  inactivityThresholdMinutes?: number
}

export class CleanupService {
  private db: Database
  private livekit: LivekitService
  private logger: Logger
  private inactivityThresholdMinutes: number
  private intervalId: NodeJS.Timeout | null = null

  constructor(options: CleanupServiceOptions) {
    this.db = options.db
    this.livekit = options.livekit
    this.logger = options.logger
    this.inactivityThresholdMinutes = options.inactivityThresholdMinutes || 1
  }

  start() {
    if (this.intervalId) {
      this.logger.warn('Cleanup service already running')
      return
    }

    this.logger.info(
      { inactivityThresholdMinutes: this.inactivityThresholdMinutes },
      'Starting cleanup service'
    )

    
    this.cleanup().catch(err => {
      this.logger.error({ err }, 'Error in initial cleanup')
    })

    
    this.intervalId = setInterval(
      () => {
        this.cleanup().catch(err => {
          this.logger.error({ err }, 'Error in scheduled cleanup')
        })
      },
      60 * 1000 
    )
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.logger.info('Cleanup service stopped')
    }
  }

  private async cleanup() {
    try {
      this.logger.debug('Running cleanup check...')

      
      const rooms = await roomRepository(this.db).getActiveRooms()

      if (rooms.length === 0) {
        this.logger.debug('No active rooms to check')
        return
      }

      this.logger.debug({ roomCount: rooms.length }, 'Checking rooms for cleanup')

      const now = Date.now()
      const thresholdMs = this.inactivityThresholdMinutes * 60 * 1000

      for (const room of rooms) {
        try {
          
          const participants = await participantRepository(this.db).getByRoomId(room.id)

          
          const leftParticipants = participants.filter(p => p.leftAt !== null)
          const activeParticipants = participants.filter(p => p.leftAt === null)

          
          if (activeParticipants.length === 0 && participants.length > 0) {
            
            const lastLeftAt = Math.max(
              ...leftParticipants.map(p => (p.leftAt ? new Date(p.leftAt).getTime() : 0))
            )

            const inactiveDuration = now - lastLeftAt

            
            if (inactiveDuration >= thresholdMs) {
              this.logger.info(
                {
                  roomId: room.id,
                  roomName: room.name,
                  meetingId: room.meetingId,
                  inactiveDurationMs: inactiveDuration,
                },
                'Ending inactive room'
              )

              try {
                await this.livekit.deleteRoom(room.name)
              } catch (lkErr) {
                this.logger.warn(
                  { lkErr, roomName: room.name },
                  'Failed to delete LiveKit room (may already be deleted)'
                )
              }

              
              await roomRepository(this.db).softDelete(room.id)

              
              await participantRepository(this.db).markAsLeftByRoomId(room.id)

              this.logger.info({ roomId: room.id }, 'Room cleaned up successfully')
            } else {
              const remainingMs = thresholdMs - inactiveDuration
              this.logger.debug(
                {
                  roomId: room.id,
                  roomName: room.name,
                  remainingMs,
                },
                'Room inactive but within threshold'
              )
            }
          } else if (activeParticipants.length > 0) {
            this.logger.debug(
              {
                roomId: room.id,
                roomName: room.name,
                activeParticipants: activeParticipants.length,
              },
              'Room has active participants, skipping'
            )
          }
        } catch (roomErr) {
          this.logger.error(
            { roomErr, roomId: room.id, roomName: room.name },
            'Error processing room for cleanup'
          )
        }
      }

      this.logger.debug('Cleanup check completed')
    } catch (err) {
      this.logger.error({ err }, 'Fatal error in cleanup service')
      throw err
    }
  }

  /**
   * Manually trigger cleanup (useful for testing)
   */
  async manualCleanup() {
    this.logger.info('Manual cleanup triggered')
    await this.cleanup()
  }
}

/**
 * Create and return a cleanup service instance
 */
export function createCleanupService(options: CleanupServiceOptions): CleanupService {
  return new CleanupService(options)
}
