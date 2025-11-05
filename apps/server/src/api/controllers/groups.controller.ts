import type { Context } from 'hono'
import { createGroupService } from '../../services/groups.service.ts'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
})

const joinGroupSchema = z.object({
  inviteCode: z.string().length(10),
})

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

const removeMemberSchema = z.object({
  userId: z.string().uuid(),
})

export const createGroup = async (c: Context) => {
  try {
    const db = c.get('db')
    const userId = c.get('userId')
    const body = await c.req.json()

    const { name } = createGroupSchema.parse(body)

    const groupService = createGroupService(db)
    const group = await groupService.createGroup(name, userId)

    return c.json(
      {
        success: true,
        data: group,
      },
      201
    )
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
}

export const getMyGroups = async (c: Context) => {
  try {
    const db = c.get('db')
    const userId = c.get('userId')

    const groupService = createGroupService(db)
    const groups = await groupService.getUserGroups(userId)

    return c.json({
      success: true,
      data: groups,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
}

export const getGroup = async (c: Context) => {
  try {
    const db = c.get('db')
    const userId = c.get('userId')
    const groupId = c.req.param('groupId')

    const groupService = createGroupService(db)
    const group = await groupService.getGroup(groupId)

    if (!group) {
      return c.json(
        {
          success: false,
          error: 'Group not found',
        },
        404
      )
    }

    return c.json({
      success: true,
      data: group,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
}

export const getGroupMembers = async (c: Context) => {
  try {
    const db = c.get('db')
    const groupId = c.req.param('groupId')

    const groupService = createGroupService(db)
    const members = await groupService.getGroupMembers(groupId)

    return c.json({
      success: true,
      data: members,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
}

export const joinGroup = async (c: Context) => {
  try {
    const db = c.get('db')
    const userId = c.get('userId')
    const body = await c.req.json()

    const { inviteCode } = joinGroupSchema.parse(body)

    const groupService = createGroupService(db)
    const group = await groupService.joinGroup(inviteCode, userId)

    return c.json({
      success: true,
      data: group,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
}

export const removeMember = async (c: Context) => {
  try {
    const db = c.get('db')
    const requestingUserId = c.get('userId')
    const groupId = c.req.param('groupId')
    const body = await c.req.json()

    const { userId } = removeMemberSchema.parse(body)

    const groupService = createGroupService(db)
    await groupService.removeMember(groupId, userId, requestingUserId)

    return c.json({
      success: true,
      message: 'Member removed successfully',
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
}

export const updateGroup = async (c: Context) => {
  try {
    const db = c.get('db')
    const userId = c.get('userId')
    const groupId = c.req.param('groupId')
    const body = await c.req.json()

    const data = updateGroupSchema.parse(body)

    const groupService = createGroupService(db)
    const group = await groupService.updateGroup(groupId, data, userId)

    return c.json({
      success: true,
      data: group,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
}

export const deleteGroup = async (c: Context) => {
  try {
    const db = c.get('db')
    const userId = c.get('userId')
    const groupId = c.req.param('groupId')

    const groupService = createGroupService(db)
    await groupService.deleteGroup(groupId, userId)

    return c.json({
      success: true,
      message: 'Group deleted successfully',
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
}

export const regenerateInviteCode = async (c: Context) => {
  try {
    const db = c.get('db')
    const userId = c.get('userId')
    const groupId = c.req.param('groupId')

    const groupService = createGroupService(db)
    const group = await groupService.regenerateInviteCode(groupId, userId)

    return c.json({
      success: true,
      data: group,
    })
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
}
