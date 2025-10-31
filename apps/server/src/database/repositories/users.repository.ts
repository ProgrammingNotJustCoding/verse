import { createInsertSchema } from 'drizzle-zod'
import { users } from '../schema/users.ts'
import { eq } from 'drizzle-orm'
import type { Database } from '../db.ts'

export const insertUserSchema = createInsertSchema(users)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

class UserRepository {
  constructor(private db: Database) {}

  async getAll(): Promise<User[]> {
    return await this.db.select().from(users)
  }

  async getOneByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email))
    return result[0]
  }

  async getById(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id))
    return result[0]
  }

  async create(userData: NewUser): Promise<User> {
    const validatedData = insertUserSchema.parse(userData)
    const result = await this.db.insert(users).values(validatedData).returning()
    return result[0]
  }

  async update(id: string, userData: Partial<NewUser>): Promise<User | undefined> {
    const result = await this.db.update(users).set(userData).where(eq(users.id, id)).returning()
    return result[0]
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id)).returning()
    return result.length > 0
  }
}

export const userRepository = (db: Database) => new UserRepository(db)
