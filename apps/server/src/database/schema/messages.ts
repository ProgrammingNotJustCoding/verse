import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { groups } from './groups.ts'
import { users } from './users.ts'
import { meetings } from './meetings.ts'

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  meetingId: uuid('meeting_id').references(() => meetings.id), // if it's a meeting notification
  content: text('content').notNull(),
  type: text('type').$type<'message' | 'meeting_started' | 'meeting_ended'>().default('message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
