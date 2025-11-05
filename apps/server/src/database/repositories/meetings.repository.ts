import { createInsertSchema } from 'drizzle-zod'
import { meetings } from '../schema/meetings.ts'
import { users } from '../schema/users.ts'
import { rooms } from '../schema/rooms.ts'
import { eq, and, isNull, desc } from 'drizzle-orm'
import type { Database } from '../db.ts'

export const insertMeetingSchema = createInsertSchema(meetings)

export type Meeting = typeof meetings.$inferSelect
export type NewMeeting = typeof meetings.$inferInsert

class MeetingRepository {
  constructor(private db: Database) {}

  async getById(id: string): Promise<Meeting | undefined> {
    const result = await this.db.select().from(meetings).where(eq(meetings.id, id))
    return result[0]
  }

  async getGroupMeetings(groupId: string) {
    return await this.db
      .select({
        meeting: meetings,
        room: rooms,
        startedByUser: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(meetings)
      .leftJoin(rooms, eq(rooms.meetingId, meetings.id))
      .leftJoin(users, eq(users.id, meetings.startedBy))
      .where(eq(meetings.groupId, groupId))
      .orderBy(desc(meetings.startedAt))
  }

  async getActiveMeeting(groupId: string): Promise<Meeting | undefined> {
    const result = await this.db
      .select()
      .from(meetings)
      .where(and(eq(meetings.groupId, groupId), isNull(meetings.endedAt)))
      .orderBy(desc(meetings.startedAt))
    return result[0]
  }

  async create(meetingData: NewMeeting): Promise<Meeting> {
    const validatedData = insertMeetingSchema.parse(meetingData)
    const result = await this.db.insert(meetings).values(validatedData).returning()
    return result[0]
  }

  async end(id: string): Promise<Meeting | undefined> {
    const meeting = await this.getById(id)
    if (!meeting) return undefined

    const endedAt = new Date()
    const durationSeconds = Math.floor((endedAt.getTime() - meeting.startedAt.getTime()) / 1000)

    const result = await this.db
      .update(meetings)
      .set({ endedAt, durationSeconds })
      .where(eq(meetings.id, id))
      .returning()
    return result[0]
  }

  async update(id: string, data: Partial<NewMeeting>): Promise<Meeting | undefined> {
    const result = await this.db.update(meetings).set(data).where(eq(meetings.id, id)).returning()
    return result[0]
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(meetings).where(eq(meetings.id, id)).returning()
    return result.length > 0
  }
}

export const meetingRepository = (db: Database) => new MeetingRepository(db)
