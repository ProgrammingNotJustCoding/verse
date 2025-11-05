import { useGroupsStore } from '../store/groups'
import * as groupService from '../services/groups.service'
import { toast } from 'react-hot-toast'

export function useGroups() {
  const {
    groups,
    activeGroup,
    isLoading,
    error,
    setGroups,
    setActiveGroup,
    addGroup,
    updateGroup,
    removeGroup,
    setLoading,
    setError,
  } = useGroupsStore()

  const fetchGroups = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await groupService.getMyGroups()
      if (response.success) {
        setGroups(response.data)
      } else {
        throw new Error('Failed to fetch groups')
      }
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const createGroup = async (name: string) => {
    setLoading(true)
    try {
      const response = await groupService.createGroup({ name })
      if (response.success) {
        addGroup(response.data)
        toast.success(`Group "${name}" created!`)
        return response.data
      } else {
        throw new Error('Failed to create group')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group')
      return null
    } finally {
      setLoading(false)
    }
  }

  const joinGroup = async (inviteCode: string) => {
    setLoading(true)
    try {
      const response = await groupService.joinGroup({ inviteCode })
      if (response.success) {
        addGroup(response.data)
        toast.success(`Joined "${response.data.name}"!`)
        return response.data
      } else {
        throw new Error('Invalid invite code')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to join group')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateGroupName = async (groupId: string, name: string) => {
    try {
      const response = await groupService.updateGroup(groupId, { name })
      if (response.success) {
        updateGroup(groupId, response.data)
        toast.success('Group updated!')
        return true
      }
      return false
    } catch (err: any) {
      toast.error(err.message || 'Failed to update group')
      return false
    }
  }

  const deleteGroup = async (groupId: string) => {
    try {
      const response = await groupService.deleteGroup(groupId)
      if (response.success) {
        removeGroup(groupId)
        toast.success('Group deleted')
        return true
      }
      return false
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete group')
      return false
    }
  }

  const regenerateCode = async (groupId: string) => {
    try {
      const response = await groupService.regenerateInviteCode(groupId)
      if (response.success) {
        updateGroup(groupId, { inviteCode: response.data.inviteCode })
        toast.success('New invite code generated!')
        return response.data.inviteCode
      }
      return null
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate code')
      return null
    }
  }

  return {
    groups,
    activeGroup,
    isLoading,
    error,
    setActiveGroup,
    fetchGroups,
    createGroup,
    joinGroup,
    updateGroupName,
    deleteGroup,
    regenerateCode,
  }
}
