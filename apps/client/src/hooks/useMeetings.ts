import { useEffect } from 'react'
import { useGroupsStore } from '../store/groups'
import * as meetingService from '../services/meetings.service'
import { toast } from 'react-hot-toast'

export function useMeetings(groupId: string | null) {
  const {
    groupMeetings,
    activeMeeting,
    setGroupMeetings,
    addMeeting,
    setActiveMeeting,
    updateMeeting,
  } = useGroupsStore()

  const meetings = groupId ? groupMeetings[groupId] || [] : []
  const currentMeeting = groupId ? activeMeeting[groupId] || null : null

  const fetchMeetings = async () => {
    if (!groupId) return

    try {
      const response = await meetingService.getGroupMeetings(groupId)
      if (response.success) {
        const meetingList = response.data.map(item => item.meeting)
        setGroupMeetings(groupId, meetingList)
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err)
    }
  }

  const fetchActiveMeeting = async () => {
    if (!groupId) return

    try {
      const response = await meetingService.getActiveMeeting(groupId)
      if (response.success && response.data) {
        setActiveMeeting(groupId, response.data.meeting)
        return response.data
      }
      setActiveMeeting(groupId, null)
      return null
    } catch (err) {
      console.error('Failed to fetch active meeting:', err)
      return null
    }
  }

  const startMeeting = async (name?: string) => {
    if (!groupId) return null

    try {
      const response = await meetingService.startMeeting({ groupId, name })
      if (response.success) {
        addMeeting(groupId, response.data.meeting)
        setActiveMeeting(groupId, response.data.meeting)
        toast.success('Meeting started!')
        return response.data
      }
      return null
    } catch (err: any) {
      toast.error(err.message || 'Failed to start meeting')
      return null
    }
  }

  const endMeeting = async (meetingId: string) => {
    if (!groupId) return false

    try {
      const response = await meetingService.endMeeting(meetingId)
      if (response.success) {
        updateMeeting(groupId, meetingId, response.data.meeting)
        setActiveMeeting(groupId, null)
        toast.success('Meeting ended')
        return true
      }
      return false
    } catch (err: any) {
      toast.error(err.message || 'Failed to end meeting')
      return false
    }
  }

  useEffect(() => {
    if (groupId) {
      fetchMeetings()
      fetchActiveMeeting()
    }
  }, [groupId])

  return {
    meetings,
    currentMeeting,
    fetchMeetings,
    fetchActiveMeeting,
    startMeeting,
    endMeeting,
  }
}
