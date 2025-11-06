import { create } from 'zustand'
import type { Room } from '../services/room/room.service'

interface RoomsState {
  activeRoom: Room | null
  rooms: Room[]
  setActiveRoom: (room: Room | null) => void
  addRoom: (room: Room) => void
  removeRoom: (roomId: string) => void
  clearActiveRoom: () => void
}

export const useRoomsStore = create<RoomsState>((set) => ({
  activeRoom: null,
  rooms: [],

  setActiveRoom: (room) => set({ activeRoom: room }),

  addRoom: (room) =>
    set((state) => ({
      rooms: [...state.rooms, room],
      activeRoom: room,
    })),

  removeRoom: (roomId) =>
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== roomId),
      activeRoom: state.activeRoom?.id === roomId ? null : state.activeRoom,
    })),

  clearActiveRoom: () => set({ activeRoom: null }),
}))
