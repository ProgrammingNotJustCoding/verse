import { create } from 'zustand'

export type User = {
  id: number
  name: string
  email: string
}

type UserState = {
  user: User | null
  setUser: (user: User | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>(set => ({
  user: null,
  setUser: (user: User | null) => set({ user }),
  clearUser: () => set({ user: null }),
}))
