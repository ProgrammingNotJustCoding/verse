import { createInsertSchema } from 'drizzle-zod'
import { participants } from '../schema/participants.ts'
import { eq, and, isNull, lt } from 'drizzle-orm'
import type { Database } from '../db.ts'

export const insertParticipantSchema = createInsertSchema(participants)

export type Participant = typeof participants.$inferSelect
export type NewParticipant = typeof participants.$inferInsert

class ParticipantRepository {
  constructor(private db: Database) {}

  async getAll(): Promise<Participant[]> {
    return await this.db.select().from(participants)
  }

  async getById(id: string): Promise<Participant | undefined> {
    const result = await this.db.select().from(participants).where(eq(participants.id, id))
    return result[0]
  }

  async getByRoomId(roomId: string): Promise<Participant[]> {
    return await this.db.select().from(participants).where(eq(participants.roomId, roomId))
  }

  async getActiveByRoomId(roomId: string): Promise<Participant[]> {
    return await this.db
      .select()
      .from(participants)
      .where(and(eq(participants.roomId, roomId), isNull(participants.leftAt)))
  }

  async getByUserId(userId: string): Promise<Participant[]> {
    return await this.db.select().from(participants).where(eq(participants.userId, userId))
  }

  async getByRoomAndUser(roomId: string, userId: string): Promise<Participant | undefined> {
    const result = await this.db
      .select()
      .from(participants)
      .where(and(eq(participants.roomId, roomId), eq(participants.userId, userId)))
      .orderBy(participants.joinedAt)
    return result[result.length - 1] // Get latest participation
  }

  async getActiveByRoomAndUser(roomId: string, userId: string): Promise<Participant | undefined> {
    const result = await this.db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.roomId, roomId),
          eq(participants.userId, userId),
          isNull(participants.leftAt)
        )
      )
    return result[0]
  }

  async getByIdentity(identity: string): Promise<Participant | undefined> {
    const result = await this.db
      .select()
      .from(participants)
      .where(eq(participants.identity, identity))
    return result[0]
  }

  async isAdmin(participantId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(participants)
      .where(and(eq(participants.id, participantId), eq(participants.isAdmin, true)))
    return result.length > 0
  }

  async isUserAdmin(roomId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.roomId, roomId),
          eq(participants.userId, userId),
          eq(participants.isAdmin, true),
          isNull(participants.leftAt)
        )
      )
    return result.length > 0
  }

  async create(participantData: NewParticipant): Promise<Participant> {
    const validatedData = insertParticipantSchema.parse(participantData)
    const result = await this.db.insert(participants).values(validatedData).returning()
    return result[0]
  }

  async markAsLeft(id: string): Promise<Participant | undefined> {
    const result = await this.db
      .update(participants)
      .set({ leftAt: new Date() })
      .where(eq(participants.id, id))
      .returning()
    return result[0]
  }

  async markAsLeftByRoomId(roomId: string): Promise<Participant[]> {
    return await this.db
      .update(participants)
      .set({ leftAt: new Date() })
      .where(and(eq(participants.roomId, roomId), isNull(participants.leftAt)))
      .returning()
  }

  async markAsLeftByIdentity(identity: string): Promise<Participant | undefined> {
    const result = await this.db
      .update(participants)
      .set({ leftAt: new Date() })
      .where(eq(participants.identity, identity))
      .returning()
    return result[0]
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(participants).where(eq(participants.id, id)).returning()
    return result.length > 0
  }

  async deleteByRoomId(roomId: string): Promise<boolean> {
    const result = await this.db
      .delete(participants)
      .where(eq(participants.roomId, roomId))
      .returning()
    return result.length > 0
  }

  async getParticipantCount(roomId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(participants)
      .where(and(eq(participants.roomId, roomId), isNull(participants.leftAt)))
    return result.length
  }

  async cleanupStaleParticipants(roomId: string, hoursThreshold = 24): Promise<number> {
    // Mark participants as left if they've been active for more than the threshold
    const thresholdDate = new Date()
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold)

    const result = await this.db
      .update(participants)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(participants.roomId, roomId),
          isNull(participants.leftAt),
          // Only cleanup if joined more than threshold hours ago
          // This catches participants who never properly left
          lt(participants.joinedAt, thresholdDate)
        )
      )
      .returning()

    return result.length
  }
}

export const participantRepository = (db: Database) => new ParticipantRepository(db)
