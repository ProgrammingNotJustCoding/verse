import { createInsertSchema } from 'drizzle-zod'
import { messages } from '../schema/messages.ts'
import { users } from '../schema/users.ts'
import { eq, desc, and, gt } from 'drizzle-orm'
import type { Database } from '../db.ts'

export const insertMessageSchema = createInsertSchema(messages)

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

class MessageRepository {
  constructor(private db: Database) {}

  async getById(id: string): Promise<Message | undefined> {
    const result = await this.db.select().from(messages).where(eq(messages.id, id))
    return result[0]
  }

  async getGroupMessages(groupId: string, limit = 100) {
    return await this.db
      .select({
        message: messages,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.userId))
      .where(eq(messages.groupId, groupId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
  }

  async getMessagesSince(groupId: string, since: Date) {
    return await this.db
      .select({
        message: messages,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.userId))
      .where(and(eq(messages.groupId, groupId), gt(messages.createdAt, since)))
      .orderBy(messages.createdAt)
  }

  async create(messageData: NewMessage): Promise<Message> {
    const result = await this.db.insert(messages).values(messageData).returning()
    return result[0]
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(messages).where(eq(messages.id, id)).returning()
    return result.length > 0
  }
}

export const messageRepository = (db: Database) => new MessageRepository(db)
