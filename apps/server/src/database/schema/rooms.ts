import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { meetings } from './meetings.ts'

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  sid: text('sid').notNull().unique(),
  name: text('name').notNull(),
  meetingId: uuid('meeting_id').references(() => meetings.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})
