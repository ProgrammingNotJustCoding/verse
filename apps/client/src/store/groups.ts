import { create } from 'zustand'

export type Message = {
  id: string
  text: string
  sender: string
  timestamp: number
}

export type Group = {
  id: string
  name: string
  messages: Message[]
  lastMessage?: string
  lastMessageTime?: string
}

type GroupsState = {
  groups: Group[]
  activeGroup: Group | null
  addGroup: (name: string) => void
  setActiveGroup: (group: Group | null) => void
  addMessage: (groupId: string, message: Omit<Message, 'id' | 'timestamp'>) => void
}

const initialData: Group[] = [
  {
    id: '1',
    name: 'General',
    messages: [
      { id: '1', text: 'Welcome to General!', sender: 'Admin', timestamp: Date.now() - 20000 },
    ],
    lastMessage: 'Welcome to General!',
    lastMessageTime: 'Yesterday',
  },
  {
    id: '2',
    name: 'Engineering',
    messages: [
      { id: '1', text: 'This is the engineering channel.', sender: 'Admin', timestamp: Date.now() - 10000 },
      { id: '2', text: 'Anyone seen the new PR?', sender: 'Alex', timestamp: Date.now() },
    ],
    lastMessage: 'Anyone seen the new PR?',
    lastMessageTime: '1:12 PM',
  },
  {
    id: '3',
    name: 'Design',
    messages: [],
  },
]

export const useGroupsStore = create<GroupsState>(set => ({
  groups: initialData,
  activeGroup: null,
  setActiveGroup: (group: Group | null) => set({ activeGroup: group }),
  addGroup: (name: string) =>
    set(state => ({
      groups: [
        ...state.groups,
        { id: `group-${Date.now()}`, name, messages: [] },
      ],
    })),
  addMessage: (groupId, message) =>
    set(state => ({
      groups: state.groups.map(group => {
        if (group.id === groupId) {
          const newMessage = {
            ...message,
            id: `msg-${Date.now()}`,
            timestamp: Date.now(),
          }
          return {
            ...group,
            messages: [...group.messages, newMessage],
            lastMessage: newMessage.text,
            lastMessageTime: new Date(newMessage.timestamp).toLocaleTimeString(
              undefined,
              { timeStyle: 'short' }
            ),
          }
        }
        return group
      }),
    })),
}))
