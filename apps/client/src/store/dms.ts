import { create } from 'zustand'

export type Message = {
  id: string
  text: string
  sender: string
  timestamp: number
}

export type Dm = {
  id: string
  name: string
  avatar: string
  messages: Message[]
}

type DmsState = {
  dms: Dm[]
  activeDm: Dm | null
  setActiveDm: (dm: Dm | null) => void
  addMessage: (dmId: string, message: Omit<Message, 'id' | 'timestamp'>) => void
  addDm: (name: string) => void
  getDmByUserId: (userId: string) => Dm | undefined
}

const initialDms: Dm[] = [
  {
    id: '2',
    name: 'Alice',
    avatar: '/avatars/alice.jpg',
    messages: [
      { id: 'msg1', text: 'See you tomorrow!', sender: 'Alice', timestamp: Date.now() - 10000 },
    ],
  },
  {
    id: '3',
    name: 'Bob',
    avatar: '/avatars/bob.jpg',
    messages: [
      { id: 'msg2', text: 'Sounds good, thanks!', sender: 'Bob', timestamp: Date.now() - 20000 },
    ],
  },
  {
    id: '4',
    name: 'Charlie',
    avatar: '/avatars/charlie.jpg',
    messages: [
      { id: 'msg3', text: 'Can you review my PR?', sender: 'Charlie', timestamp: Date.now() - 30000 },
    ],
  },
  {
    id: '5',
    name: 'David',
    avatar: '/avatars/david.jpg',
    messages: [
      { id: 'msg4', text: 'Meeting at 3 PM.', sender: 'David', timestamp: Date.now() - 40000 },
    ],
  },
  {
    id: '6',
    name: 'Eve',
    avatar: '/avatars/eve.jpg',
    messages: [
      { id: 'msg5', text: 'Got it, thanks!', sender: 'Eve', timestamp: Date.now() - 50000 },
    ],
  },
  {
    id: '7',
    name: 'Sarah',
    avatar: '/avatars/sarah.jpg',
    messages: [
      { id: 'msg6', text: 'See you in the call.', sender: 'Sarah', timestamp: Date.now() - 60000 },
    ],
  },
]

export const useDmsStore = create<DmsState>((set, get) => ({
  dms: initialDms,
  activeDm: null,
  setActiveDm: (dm: Dm | null) => set({ activeDm: dm }),
  addMessage: (dmId, message) => {
    set(state => ({
      dms: state.dms.map(dm =>
        dm.id === dmId
          ? {
              ...dm,
              messages: [
                ...dm.messages,
                {
                  ...message,
                  id: `msg${Date.now()}`,
                  timestamp: Date.now(),
                },
              ],
            }
          : dm
      ),
    }))
  },
  addDm: (name: string) => {
    set(state => ({
      dms: [
        ...state.dms,
        {
          id: `dm-${Date.now()}`,
          name,
          avatar: `/avatars/${name.toLowerCase()}.jpg`,
          messages: [],
        },
      ],
    }))
  },
  getDmByUserId: (userId: string) => {
    return get().dms.find(dm => dm.id === userId)
  },
}))
