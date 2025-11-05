import { createInsertSchema } from 'drizzle-zod'
import { rooms } from '../schema/rooms.ts'
import { eq, and, isNull } from 'drizzle-orm'
import type { Database } from '../db.ts'

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

  async getActiveRooms(): Promise<Room[]> {
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
    const result = await this.db.insert(rooms).values(roomData).returning()
    return result[0]
  }

  async update(id: string, roomData: Partial<NewRoom>): Promise<Room | undefined> {
    const result = await this.db
      .update(rooms)
      .set(roomData)
      .where(and(eq(rooms.id, id), isNull(rooms.deletedAt)))
      .returning()
    return result[0]
  }

  async updateBySid(sid: string, roomData: Partial<NewRoom>): Promise<Room | undefined> {
    const result = await this.db
      .update(rooms)
      .set(roomData)
      .where(and(eq(rooms.sid, sid), isNull(rooms.deletedAt)))
      .returning()
    return result[0]
  }

  async softDelete(id: string): Promise<Room | undefined> {
    const result = await this.db
      .update(rooms)
      .set({ deletedAt: new Date() })
      .where(and(eq(rooms.id, id), isNull(rooms.deletedAt)))
      .returning()
    return result[0]
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(rooms).where(eq(rooms.id, id)).returning()
    return result.length > 0
  }
}

export const roomRepository = (db: Database) => new RoomRepository(db)
