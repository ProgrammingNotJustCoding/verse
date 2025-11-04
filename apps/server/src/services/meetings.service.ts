import type { Database } from '../database/db.ts'
import type { LivekitService } from './livekit.service.ts'
import { meetingRepository } from '../database/repositories/meetings.repository.ts'
import { groupRepository } from '../database/repositories/groups.repository.ts'
import { roomRepository } from '../database/repositories/rooms.repository.ts'

export class MeetingService {
  private meetingRepo: ReturnType<typeof meetingRepository>
  private groupRepo: ReturnType<typeof groupRepository>
  private roomRepo: ReturnType<typeof roomRepository>

  constructor(
    private db: Database,
    private livekit: LivekitService
  ) {
    this.meetingRepo = meetingRepository(db)
    this.groupRepo = groupRepository(db)
    this.roomRepo = roomRepository(db)
  }

  async startMeeting(groupId: string, userId: string, name?: string) {
    const isInGroup = await this.groupRepo.isUserInGroup(groupId, userId)
    if (!isInGroup) {
      throw new Error('User not in group')
    }

    const activeMeeting = await this.meetingRepo.getActiveMeeting(groupId)
    if (activeMeeting) {
      throw new Error('There is already an active meeting in this group')
    }

    const meeting = await this.meetingRepo.create({
      groupId,
      startedBy: userId,
      startedAt: new Date(),
      name: name || `Group Meeting`,
    })

    const roomName = `meeting-${meeting.id}`
    const lkRoom = await this.livekit.createRoom(roomName, 50)

    await this.roomRepo.create({
      sid: lkRoom.sid,
      name: lkRoom.name,
      meetingId: meeting.id,
    })

    return { meeting, room: lkRoom }
  }

  async endMeeting(meetingId: string, userId: string) {
    const meeting = await this.meetingRepo.getById(meetingId)
    if (!meeting) {
      throw new Error('Meeting not found')
    }

    // Check if user is in group
    const isInGroup = await this.groupRepo.isUserInGroup(meeting.groupId, userId)
    if (!isInGroup) {
      throw new Error('User not in group')
    }

    // Only starter or admin can end meeting
    const isAdmin = await this.groupRepo.isUserAdmin(meeting.groupId, userId)
    if (meeting.startedBy !== userId && !isAdmin) {
      throw new Error('Only meeting starter or admin can end meeting')
    }

    // End meeting in DB
    const endedMeeting = await this.meetingRepo.end(meetingId)

    // End LiveKit room
    const room = await this.roomRepo.getByMeetingId(meetingId)
    if (room && room.name) {
      try {
        await this.livekit.deleteRoom(room.name)
      } catch (error) {
        console.error('Failed to delete LiveKit room:', error)
      }
    }

    // Generate summary asynchronously (don't wait)
    const { createSummaryService } = await import('./summary.service.ts')
    const summaryService = createSummaryService(this.db)
    summaryService.generateMeetingSummary(meetingId).catch(error => {
      console.error('Failed to generate meeting summary:', error)
    })

    return endedMeeting
  }

  async getGroupMeetings(groupId: string, userId: string) {
    const isInGroup = await this.groupRepo.isUserInGroup(groupId, userId)
    if (!isInGroup) {
      throw new Error('User not in group')
    }

    return await this.meetingRepo.getGroupMeetings(groupId)
  }

  async getMeeting(meetingId: string, userId: string) {
    const meeting = await this.meetingRepo.getById(meetingId)
    if (!meeting) {
      throw new Error('Meeting not found')
    }

    const isInGroup = await this.groupRepo.isUserInGroup(meeting.groupId, userId)
    if (!isInGroup) {
      throw new Error('User not in group')
    }

    return meeting
  }

  async getActiveMeeting(groupId: string, userId: string) {
    const isInGroup = await this.groupRepo.isUserInGroup(groupId, userId)
    if (!isInGroup) {
      throw new Error('User not in group')
    }

    return await this.meetingRepo.getActiveMeeting(groupId)
  }
}

export const createMeetingService = (db: Database, livekit: LivekitService) =>
  new MeetingService(db, livekit)
