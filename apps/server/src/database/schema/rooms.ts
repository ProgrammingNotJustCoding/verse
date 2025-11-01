import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users.ts'

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  meetingId: text('meeting_id').unique(), // 6-digit meeting code (auto-generated)
  name: text('name').notNull(),
  sid: text('sid').notNull().unique(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  maxParticipants: integer('max_participants').default(20),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})
