import { API } from '../utils/api'
import { getAuthToken } from './auth.service'
import type {
  CreateGroupData,
  JoinGroupData,
  UpdateGroupData,
  RemoveMemberData,
  GroupsResponse,
  GroupResponse,
  GroupMembersResponse,
} from '../types/groups.types'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAuthToken()}`,
})

export async function createGroup(data: CreateGroupData): Promise<GroupResponse> {
  const res = await fetch(`${API.BASE_URL}${API.GROUPS.BASE_URL()}${API.GROUPS.CREATE()}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function getMyGroups(): Promise<GroupsResponse> {
  const res = await fetch(`${API.BASE_URL}${API.GROUPS.BASE_URL()}${API.GROUPS.MY_GROUPS()}`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return res.json()
}

export async function getGroup(groupId: string): Promise<GroupResponse> {
  const res = await fetch(`${API.BASE_URL}${API.GROUPS.BASE_URL()}${API.GROUPS.GET(groupId)}`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return res.json()
}

export async function getGroupMembers(groupId: string): Promise<GroupMembersResponse> {
  const res = await fetch(`${API.BASE_URL}${API.GROUPS.BASE_URL()}${API.GROUPS.MEMBERS(groupId)}`, {
    method: 'GET',
    headers: getHeaders(),
  })
  return res.json()
}

export async function joinGroup(data: JoinGroupData): Promise<GroupResponse> {
  const res = await fetch(`${API.BASE_URL}${API.GROUPS.BASE_URL()}${API.GROUPS.JOIN()}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function removeMember(
  groupId: string,
  data: RemoveMemberData
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(
    `${API.BASE_URL}${API.GROUPS.BASE_URL()}${API.GROUPS.REMOVE_MEMBER(groupId)}`,
    {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }
  )
  return res.json()
}

export async function updateGroup(groupId: string, data: UpdateGroupData): Promise<GroupResponse> {
  const res = await fetch(`${API.BASE_URL}${API.GROUPS.BASE_URL()}${API.GROUPS.UPDATE(groupId)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deleteGroup(groupId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API.BASE_URL}${API.GROUPS.BASE_URL()}${API.GROUPS.DELETE(groupId)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  return res.json()
}

export async function regenerateInviteCode(groupId: string): Promise<GroupResponse> {
  const res = await fetch(
    `${API.BASE_URL}${API.GROUPS.BASE_URL()}${API.GROUPS.REGENERATE_CODE(groupId)}`,
    {
      method: 'POST',
      headers: getHeaders(),
    }
  )
  return res.json()
}
