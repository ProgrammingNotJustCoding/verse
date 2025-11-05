import { useEffect } from 'react'
import { useGroupsStore } from '../store/groups'
import * as groupService from '../services/groups.service'
import { toast } from 'react-hot-toast'

export function useGroupMembers(groupId: string | null) {
  const { groupMembers, setGroupMembers, removeMember: removeFromStore } = useGroupsStore()

  const members = groupId ? groupMembers[groupId] || [] : []

  const fetchMembers = async () => {
    if (!groupId) return

    try {
      const response = await groupService.getGroupMembers(groupId)
      if (response.success) {
        setGroupMembers(groupId, response.data)
      }
    } catch (err) {
      console.error('Failed to fetch members:', err)
    }
  }

  const removeMember = async (userId: string) => {
    if (!groupId) return false

    try {
      const response = await groupService.removeMember(groupId, { userId })
      if (response.success) {
        removeFromStore(groupId, userId)
        toast.success('Member removed')
        return true
      }
      return false
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member')
      return false
    }
  }

  const getMember = (userId: string) => {
    return members.find(m => m.userId === userId)
  }

  const isAdmin = (userId: string) => {
    const member = getMember(userId)
    return member?.role === 'admin'
  }

  useEffect(() => {
    if (groupId) {
      fetchMembers()
    }
  }, [groupId])

  return {
    members,
    fetchMembers,
    removeMember,
    getMember,
    isAdmin,
  }
}
