import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core'
import { groups } from './groups.ts'
import { users } from './users.ts'

export const meetings = pgTable('meetings', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  name: text('name'),
  startedBy: uuid('started_by').references(() => users.id),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  durationSeconds: integer('duration_seconds'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
