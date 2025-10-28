import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { rooms } from './rooms.ts'
import { users } from './users.ts'

export const participants = pgTable('participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id')
    .notNull()
    .references(() => rooms.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  identity: text('identity').notNull(),
  isAdmin: boolean('is_admin').default(false),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  leftAt: timestamp('left_at'),
})
