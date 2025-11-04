import type { Context } from 'hono'
import { z } from 'zod'

const sendMessageSchema = z.object({
  groupId: z.string().uuid(),
  content: z.string().min(1).max(5000),
})

export const sendMessage = async (c: Context) => {
  try {
    const chat = c.get('chat')
    const userId = c.get('userId')
    const body = await c.req.json()

    const { groupId, content } = sendMessageSchema.parse(body)

    const message = await chat.sendMessage(groupId, userId, content)

    return c.json(
      {
        success: true,
        data: message,
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

export const getGroupMessages = async (c: Context) => {
  try {
    const chat = c.get('chat')
    const userId = c.get('userId')
    const groupId = c.req.param('groupId')
    const limit = parseInt(c.req.query('limit') || '100')

    const messages = await chat.getGroupMessages(groupId, userId, limit)

    return c.json({
      success: true,
      data: messages,
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

export const getMeetingTranscript = async (c: Context) => {
  try {
    const db = c.get('db')
    const userId = c.get('userId')
    const meetingId = c.req.param('meetingId')

    const { captionRepository } = await import('../../database/repositories/captions.repository.ts')
    const { meetingRepository } = await import('../../database/repositories/meetings.repository.ts')
    const { groupRepository } = await import('../../database/repositories/groups.repository.ts')

    const captionRepo = captionRepository(db)
    const meetingRepo = meetingRepository(db)
    const groupRepo = groupRepository(db)

    const meeting = await meetingRepo.getById(meetingId)
    if (!meeting) {
      return c.json(
        {
          success: false,
          error: 'Meeting not found',
        },
        404
      )
    }

    const isInGroup = await groupRepo.isUserInGroup(meeting.groupId, userId)
    if (!isInGroup) {
      return c.json(
        {
          success: false,
          error: 'Access denied',
        },
        403
      )
    }

    const captions = await captionRepo.getMeetingCaptions(meetingId)

    return c.json({
      success: true,
      data: {
        meeting,
        captions,
      },
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

export const getMeetingSummary = async (c: Context) => {
  try {
    const db = c.get('db')
    const userId = c.get('userId')
    const meetingId = c.req.param('meetingId')

    const { captionRepository } = await import('../../database/repositories/caption.repository.ts')
    const { meetingRepository } = await import('../../database/repositories/meeting.repository.ts')
    const { groupRepository } = await import('../../database/repositories/group.repository.ts')

    const captionRepo = captionRepository(db)
    const meetingRepo = meetingRepository(db)
    const groupRepo = groupRepository(db)

    const meeting = await meetingRepo.getById(meetingId)
    if (!meeting) {
      return c.json(
        {
          success: false,
          error: 'Meeting not found',
        },
        404
      )
    }

    const isInGroup = await groupRepo.isUserInGroup(meeting.groupId, userId)
    if (!isInGroup) {
      return c.json(
        {
          success: false,
          error: 'Access denied',
        },
        403
      )
    }

    const summary = await captionRepo.getMeetingSummary(meetingId)

    return c.json({
      success: true,
      data: summary,
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
