export interface Group {
  id: string
  name: string
  inviteCode: string
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface GroupMember {
  id: string
  userId: string
  role: 'admin' | 'member'
  joinedAt: string
  userName: string
  userEmail: string
}

export interface CreateGroupData {
  name: string
}

export interface JoinGroupData {
  inviteCode: string
}

export interface UpdateGroupData {
  name?: string
}

export interface RemoveMemberData {
  userId: string
}

export interface GroupWithMembers extends Group {
  members: GroupMember[]
}

export interface GroupsResponse {
  success: boolean
  data: Group[]
}

export interface GroupResponse {
  success: boolean
  data: Group
}

export interface GroupMembersResponse {
  success: boolean
  data: GroupMember[]
}
