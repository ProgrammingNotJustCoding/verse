import { create } from 'zustand'
import {
  AudioWaveform,
  Bell,
  BrainCircuit,
  CheckSquare,
  Command,
  GalleryVerticalEnd,
  MessageSquare,
  Phone,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type Org = {
  name: string
  logo: LucideIcon
  plan: string
}

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
}

export type User = {
  name: string
  email: string
  avatar: string
}

type SidebarState = {
  orgs: Org[]
  navItems: NavItem[]
  user: User
  activeOrg: Org | null
  activeNavItem: NavItem | null
  setActiveOrg: (org: Org) => void
  setActiveNavItem: (item: NavItem) => void
  addOrg: (name: string) => void
}

const initialData = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  orgs: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navItems: [
    {
      title: 'Activity',
      url: '/dash/activity',
      icon: Bell,
      isActive: true,
    },
    {
      title: 'Chat',
      url: '/dash/chat',
      icon: MessageSquare,
    },
    {
      title: 'Groups',
      url: '/dash/groups',
      icon: Users,
    },
    {
      title: 'Calls',
      url: '/dash/calls',
      icon: Phone,
    },
    {
      title: 'Tasks',
      url: '/dash/tasks',
      icon: CheckSquare,
    },
    {
      title: 'Summaries',
      url: '/dash/summaries',
      icon: BrainCircuit,
    },
  ],
}

export const useSidebarStore = create<SidebarState>(set => ({
  ...initialData,
  activeOrg: initialData.orgs[0] || null,
  activeNavItem: initialData.navItems[0] || null,
  setActiveOrg: (org: Org) => set({ activeOrg: org }),
  setActiveNavItem: (item: NavItem) => set({ activeNavItem: item }),
  addOrg: (name: string) =>
    set(state => ({
      orgs: [
        { name, logo: Users, plan: 'Free' },
        ...state.orgs,
      ],
    })),
}))
