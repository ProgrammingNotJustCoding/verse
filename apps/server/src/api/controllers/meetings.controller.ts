import type { Context } from 'hono'
import { createMeetingService } from '../../services/meetings.service.ts'
import { z } from 'zod'

const startMeetingSchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().optional(),
})

export const startMeeting = async (c: Context) => {
  try {
    const db = c.get('db')
    const livekit = c.get('livekit')
    const chat = c.get('chat')
    const userId = c.get('userId')
    const body = await c.req.json()

    const validation = startMeetingSchema.safeParse(body)
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        400
      )
    }

    const { groupId, name } = validation.data

    const meetingService = createMeetingService(db, livekit)
    const result = await meetingService.startMeeting(groupId, userId, name)

    await chat.sendMessage(
      groupId,
      userId,
      `Meeting "${result.meeting.name}" has started`,
      'meeting_started',
      result.meeting.id
    )

    return c.json(
      {
        success: true,
        data: result,
      },
      201
    )
  } catch (error: any) {
    console.error('Start meeting error:', error)
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
}

export const endMeeting = async (c: Context) => {
  try {
    const db = c.get('db')
    const livekit = c.get('livekit')
    const chat = c.get('chat')
    const userId = c.get('userId')
    const meetingId = c.req.param('meetingId')

    const meetingService = createMeetingService(db, livekit)
    const meeting = await meetingService.endMeeting(meetingId, userId)

    if (meeting) {
      await chat.sendMessage(meeting.groupId, userId, `Meeting ended`, 'meeting_ended', meeting.id)
    }

    return c.json({
      success: true,
      data: { meeting },
    })
  } catch (error: any) {
    console.error('End meeting error:', error)
    return c.json(
      {
        success: false,
        error: error.message,
      },
      400
    )
  }
}

export const getGroupMeetings = async (c: Context) => {
  try {
    const db = c.get('db')
    const livekit = c.get('livekit')
    const userId = c.get('userId')
    const groupId = c.req.param('groupId')

    const meetingService = createMeetingService(db, livekit)
    const meetings = await meetingService.getGroupMeetings(groupId, userId)

    return c.json({
      success: true,
      data: meetings,
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

export const getMeeting = async (c: Context) => {
  try {
    const db = c.get('db')
    const livekit = c.get('livekit')
    const userId = c.get('userId')
    const meetingId = c.req.param('meetingId')

    const meetingService = createMeetingService(db, livekit)
    const meeting = await meetingService.getMeeting(meetingId, userId)

    return c.json({
      success: true,
      data: { meeting },
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

export const getActiveMeeting = async (c: Context) => {
  try {
    const db = c.get('db')
    const livekit = c.get('livekit')
    const userId = c.get('userId')
    const groupId = c.req.param('groupId')

    const meetingService = createMeetingService(db, livekit)
    const meeting = await meetingService.getActiveMeeting(groupId, userId)

    return c.json({
      success: true,
      data: meeting ? { meeting } : null,
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
