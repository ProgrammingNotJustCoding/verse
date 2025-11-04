import { createInsertSchema } from 'drizzle-zod'
import { groups } from '../schema/groups.ts'
import { groupMembers } from '../schema/groupMembers.ts'
import { users } from '../schema/users.ts'
import { eq, and, isNull } from 'drizzle-orm'
import type { Database } from '../db.ts'
import { nanoid } from 'nanoid'

export const insertGroupSchema = createInsertSchema(groups)
export const insertGroupMemberSchema = createInsertSchema(groupMembers)

export type Group = typeof groups.$inferSelect
export type NewGroup = typeof groups.$inferInsert
export type GroupMember = typeof groupMembers.$inferSelect
export type NewGroupMember = typeof groupMembers.$inferInsert

class GroupRepository {
  constructor(private db: Database) {}

  async getAll(): Promise<Group[]> {
    return await this.db.select().from(groups).where(isNull(groups.deletedAt))
  }

  async getById(id: string): Promise<Group | undefined> {
    const result = await this.db
      .select()
      .from(groups)
      .where(and(eq(groups.id, id), isNull(groups.deletedAt)))
    return result[0]
  }

  async getByInviteCode(inviteCode: string): Promise<Group | undefined> {
    const result = await this.db
      .select()
      .from(groups)
      .where(and(eq(groups.inviteCode, inviteCode), isNull(groups.deletedAt)))
    return result[0]
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const result = await this.db
      .select({
        id: groups.id,
        name: groups.name,
        inviteCode: groups.inviteCode,
        createdBy: groups.createdBy,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
        deletedAt: groups.deletedAt,
      })
      .from(groups)
      .innerJoin(groupMembers, eq(groupMembers.groupId, groups.id))
      .where(
        and(eq(groupMembers.userId, userId), isNull(groupMembers.leftAt), isNull(groups.deletedAt))
      )
    return result
  }

  async create(groupData: Omit<NewGroup, 'inviteCode'>): Promise<Group> {
    const inviteCode = nanoid(10)
    const validatedData = insertGroupSchema.parse({ ...groupData, inviteCode })
    const result = await this.db.insert(groups).values(validatedData).returning()
    return result[0]
  }

  async update(id: string, data: Partial<NewGroup>): Promise<Group | undefined> {
    const result = await this.db
      .update(groups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning()
    return result[0]
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .update(groups)
      .set({ deletedAt: new Date() })
      .where(eq(groups.id, id))
      .returning()
    return result.length > 0
  }

  async getGroupMembers(groupId: string) {
    return await this.db
      .select({
        id: groupMembers.id,
        userId: groupMembers.userId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(groupMembers)
      .innerJoin(users, eq(users.id, groupMembers.userId))
      .where(and(eq(groupMembers.groupId, groupId), isNull(groupMembers.leftAt)))
  }

  async addMember(memberData: NewGroupMember): Promise<GroupMember> {
    const result = await this.db.insert(groupMembers).values(memberData).returning()
    return result[0]
  }

  async removeMember(groupId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .update(groupMembers)
      .set({ leftAt: new Date() })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .returning()
    return result.length > 0
  }

  async isUserInGroup(groupId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId),
          isNull(groupMembers.leftAt)
        )
      )
    return result.length > 0
  }

  async isUserAdmin(groupId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId),
          eq(groupMembers.role, 'admin'),
          isNull(groupMembers.leftAt)
        )
      )
    return result.length > 0
  }
}

export const groupRepository = (db: Database) => new GroupRepository(db)
