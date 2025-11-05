import type { Database } from '../database/db.ts'
import { groupRepository } from '../database/repositories/groups.repository.ts'
import type { NewGroup } from '../database/repositories/groups.repository.ts'

export class GroupService {
  private groupRepo: ReturnType<typeof groupRepository>

  constructor(private db: Database) {
    this.groupRepo = groupRepository(db)
  }

  async createGroup(name: string, createdBy: string) {
    const group = await this.groupRepo.create({ name, createdBy })

    await this.groupRepo.addMember({
      groupId: group.id,
      userId: createdBy,
      role: 'admin',
    })

    return group
  }

  async getGroup(groupId: string) {
    return await this.groupRepo.getById(groupId)
  }

  async getUserGroups(userId: string) {
    return await this.groupRepo.getUserGroups(userId)
  }

  async getGroupMembers(groupId: string) {
    return await this.groupRepo.getGroupMembers(groupId)
  }

  async joinGroup(inviteCode: string, userId: string) {
    const group = await this.groupRepo.getByInviteCode(inviteCode)
    if (!group) {
      throw new Error('Invalid invite code')
    }

    const isAlreadyMember = await this.groupRepo.isUserInGroup(group.id, userId)
    if (isAlreadyMember) {
      throw new Error('Already a member of this group')
    }

    await this.groupRepo.addMember({
      groupId: group.id,
      userId,
      role: 'member',
    })

    return group
  }

  async removeMember(groupId: string, userId: string, requestingUserId: string) {
    const isAdmin = await this.groupRepo.isUserAdmin(groupId, requestingUserId)
    if (!isAdmin) {
      throw new Error('Only admins can remove members')
    }

    const members = await this.groupRepo.getGroupMembers(groupId)
    const admins = members.filter(m => m.role === 'admin')

    if (admins.length === 1 && admins[0].userId === userId) {
      throw new Error('Cannot remove the last admin')
    }

    await this.groupRepo.removeMember(groupId, userId)
    return true
  }

  async updateGroup(groupId: string, data: Partial<NewGroup>, userId: string) {
    const isAdmin = await this.groupRepo.isUserAdmin(groupId, userId)
    if (!isAdmin) {
      throw new Error('Only admins can update group')
    }

    return await this.groupRepo.update(groupId, data)
  }

  async deleteGroup(groupId: string, userId: string) {
    const group = await this.groupRepo.getById(groupId)
    if (!group) {
      throw new Error('Group not found')
    }

    if (group.createdBy !== userId) {
      throw new Error('Only group creator can delete group')
    }

    return await this.groupRepo.delete(groupId)
  }

  async regenerateInviteCode(groupId: string, userId: string) {
    const isAdmin = await this.groupRepo.isUserAdmin(groupId, userId)
    if (!isAdmin) {
      throw new Error('Only admins can regenerate invite code')
    }

    const { nanoid } = await import('nanoid')
    const inviteCode = nanoid(10)
    return await this.groupRepo.update(groupId, { inviteCode })
  }
}

export const createGroupService = (db: Database) => new GroupService(db)
