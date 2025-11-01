import { createInsertSchema } from 'drizzle-zod'
import { rooms } from '../schema/rooms.ts'
import { eq, and, isNull } from 'drizzle-orm'
import type { Database } from '../db.ts'
import { generateMeetingCode } from '../../utils/meeting.ts'

export const insertRoomSchema = createInsertSchema(rooms)

export type Room = typeof rooms.$inferSelect
export type NewRoom = typeof rooms.$inferInsert

class RoomRepository {
  constructor(private db: Database) {}

  async getAll(): Promise<Room[]> {
    return await this.db.select().from(rooms).where(isNull(rooms.deletedAt))
  }

  async getAllActive(): Promise<Room[]> {
    return await this.db.select().from(rooms).where(isNull(rooms.deletedAt))
  }

  async getById(id: string): Promise<Room | undefined> {
    const result = await this.db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, id), isNull(rooms.deletedAt)))
    return result[0]
  }

  async getBySid(sid: string): Promise<Room | undefined> {
    const result = await this.db
      .select()
      .from(rooms)
      .where(and(eq(rooms.sid, sid), isNull(rooms.deletedAt)))
    return result[0]
  }

  async getByCreator(creatorId: string): Promise<Room[]> {
    return await this.db
      .select()
      .from(rooms)
      .where(and(eq(rooms.createdBy, creatorId), isNull(rooms.deletedAt)))
  }

  async getByMeetingId(meetingId: string): Promise<Room | undefined> {
    const result = await this.db
      .select()
      .from(rooms)
      .where(and(eq(rooms.meetingId, meetingId), isNull(rooms.deletedAt)))
    return result[0]
  }

  async meetingIdExists(meetingId: string): Promise<boolean> {
    const result = await this.db.select().from(rooms).where(eq(rooms.meetingId, meetingId))
    return result.length > 0
  }

  async create(roomData: NewRoom): Promise<Room> {
    let meetingId = roomData.meetingId

    // If no meetingId provided, generate a unique one
    if (!meetingId) {
      let attempts = 0
      const maxAttempts = 10

      do {
        meetingId = generateMeetingCode()
        attempts++

        if (attempts >= maxAttempts) {
          throw new Error('Failed to generate unique meeting ID')
        }
      } while (await this.meetingIdExists(meetingId))
    }

    const validatedData = insertRoomSchema.parse({ ...roomData, meetingId })
    const result = await this.db.insert(rooms).values(validatedData).returning()
    return result[0]
  }

  async update(id: string, roomData: Partial<NewRoom>): Promise<Room | undefined> {
    const result = await this.db
      .update(rooms)
      .set({ ...roomData, updatedAt: new Date() })
      .where(and(eq(rooms.id, id), isNull(rooms.deletedAt)))
      .returning()
    return result[0]
  }

  async softDelete(id: string): Promise<Room | undefined> {
    const result = await this.db
      .update(rooms)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(rooms.id, id), isNull(rooms.deletedAt)))
      .returning()
    return result[0]
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(rooms).where(eq(rooms.id, id)).returning()
    return result.length > 0
  }

  async isCreator(roomId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.createdBy, userId), isNull(rooms.deletedAt)))
    return result.length > 0
  }
}

export const roomRepository = (db: Database) => new RoomRepository(db)
