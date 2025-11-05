import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core'
import { meetings } from './meetings.ts'

export const captions = pgTable('captions', {
  id: uuid('id').primaryKey().defaultRandom(),
  meetingId: uuid('meeting_id')
    .notNull()
    .references(() => meetings.id, { onDelete: 'cascade' }),
  participantIdentity: text('participant_identity').notNull(),
  text: text('text').notNull(),
  startMs: integer('start_ms').notNull(),
  endMs: integer('end_ms').notNull(),
  final: boolean('final').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
