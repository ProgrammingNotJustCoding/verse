import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { meetings } from './meetings.ts'

export const meetingSummaries = pgTable('meeting_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  meetingId: uuid('meeting_id')
    .notNull()
    .unique()
    .references(() => meetings.id, { onDelete: 'cascade' }),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
