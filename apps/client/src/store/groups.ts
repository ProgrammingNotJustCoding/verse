import { create } from 'zustand'
import type { Group, GroupMember } from '../types/groups.types'
import type { ChatMessage } from '../types/chat.types'
import type { Meeting } from '../types/meetings.types'

interface GroupState {
  groups: Group[]
  activeGroup: Group | null
  groupMembers: Record<string, GroupMember[]>
  groupMessages: Record<string, ChatMessage[]>
  groupMeetings: Record<string, Meeting[]>
  activeMeeting: Record<string, Meeting | null>
  isLoading: boolean
  error: string | null

  setGroups: (groups: Group[]) => void
  setActiveGroup: (group: Group | null) => void
  addGroup: (group: Group) => void
  updateGroup: (groupId: string, data: Partial<Group>) => void
  removeGroup: (groupId: string) => void

  setGroupMembers: (groupId: string, members: GroupMember[]) => void
  removeMember: (groupId: string, userId: string) => void

  setGroupMessages: (groupId: string, messages: ChatMessage[]) => void
  addMessage: (groupId: string, message: ChatMessage) => void
  prependMessages: (groupId: string, messages: ChatMessage[]) => void

  setGroupMeetings: (groupId: string, meetings: Meeting[]) => void
  addMeeting: (groupId: string, meeting: Meeting) => void
  setActiveMeeting: (groupId: string, meeting: Meeting | null) => void
  updateMeeting: (groupId: string, meetingId: string, data: Partial<Meeting>) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useGroupsStore = create<GroupState>(set => ({
  groups: [],
  activeGroup: null,
  groupMembers: {},
  groupMessages: {},
  groupMeetings: {},
  activeMeeting: {},
  isLoading: false,
  error: null,

  setGroups: groups => set({ groups }),

  setActiveGroup: group => set({ activeGroup: group }),

  addGroup: group =>
    set(state => ({
      groups: [...state.groups, group],
    })),

  updateGroup: (groupId, data) =>
    set(state => ({
      groups: state.groups.map(g => (g.id === groupId ? { ...g, ...data } : g)),
      activeGroup:
        state.activeGroup?.id === groupId ? { ...state.activeGroup, ...data } : state.activeGroup,
    })),

  removeGroup: groupId =>
    set(state => ({
      groups: state.groups.filter(g => g.id !== groupId),
      activeGroup: state.activeGroup?.id === groupId ? null : state.activeGroup,
    })),

  setGroupMembers: (groupId, members) =>
    set(state => ({
      groupMembers: { ...state.groupMembers, [groupId]: members },
    })),

  removeMember: (groupId, userId) =>
    set(state => ({
      groupMembers: {
        ...state.groupMembers,
        [groupId]: state.groupMembers[groupId]?.filter(m => m.userId !== userId) || [],
      },
    })),

  setGroupMessages: (groupId, messages) =>
    set(state => ({
      groupMessages: { ...state.groupMessages, [groupId]: messages },
    })),

  addMessage: (groupId, message) =>
    set(state => ({
      groupMessages: {
        ...state.groupMessages,
        [groupId]: [...(state.groupMessages[groupId] || []), message],
      },
    })),

  prependMessages: (groupId, messages) =>
    set(state => ({
      groupMessages: {
        ...state.groupMessages,
        [groupId]: [...messages, ...(state.groupMessages[groupId] || [])],
      },
    })),

  setGroupMeetings: (groupId, meetings) =>
    set(state => ({
      groupMeetings: { ...state.groupMeetings, [groupId]: meetings },
    })),

  addMeeting: (groupId, meeting) =>
    set(state => ({
      groupMeetings: {
        ...state.groupMeetings,
        [groupId]: [meeting, ...(state.groupMeetings[groupId] || [])],
      },
    })),

  setActiveMeeting: (groupId, meeting) =>
    set(state => ({
      activeMeeting: { ...state.activeMeeting, [groupId]: meeting },
    })),

  updateMeeting: (groupId, meetingId, data) =>
    set(state => ({
      groupMeetings: {
        ...state.groupMeetings,
        [groupId]:
          state.groupMeetings[groupId]?.map(m => (m.id === meetingId ? { ...m, ...data } : m)) ||
          [],
      },
    })),

  setLoading: loading => set({ isLoading: loading }),
  setError: error => set({ error }),
  clearError: () => set({ error: null }),
}))
