import { captions } from '../schema/captions.ts'
import { meetingSummaries } from '../schema/meetingSummaries.ts'
import { eq, asc } from 'drizzle-orm'
import type { Database } from '../db.ts'

export type Caption = typeof captions.$inferSelect
export type MeetingSummary = typeof meetingSummaries.$inferSelect
export type NewMeetingSummary = typeof meetingSummaries.$inferInsert

class CaptionRepository {
  constructor(private db: Database) {}

  async getMeetingCaptions(meetingId: string): Promise<Caption[]> {
    return await this.db
      .select()
      .from(captions)
      .where(eq(captions.meetingId, meetingId))
      .orderBy(asc(captions.startMs))
  }

  async getMeetingSummary(meetingId: string): Promise<MeetingSummary | undefined> {
    const result = await this.db
      .select()
      .from(meetingSummaries)
      .where(eq(meetingSummaries.meetingId, meetingId))
    return result[0]
  }

  async createSummary(summaryData: NewMeetingSummary): Promise<MeetingSummary> {
    const result = await this.db.insert(meetingSummaries).values(summaryData).returning()
    return result[0]
  }

  async updateSummary(
    meetingId: string,
    data: Partial<NewMeetingSummary>
  ): Promise<MeetingSummary | undefined> {
    const result = await this.db
      .update(meetingSummaries)
      .set(data)
      .where(eq(meetingSummaries.meetingId, meetingId))
      .returning()
    return result[0]
  }
}

export const captionRepository = (db: Database) => new CaptionRepository(db)
