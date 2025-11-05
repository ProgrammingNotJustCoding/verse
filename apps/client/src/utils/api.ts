export const API = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',

  AUTH: {
    BASE_URL: () => '/auth',
    SIGN_UP: () => '/signup',
    LOGIN: () => '/login',
  },

  GROUPS: {
    BASE_URL: () => '/groups',
    CREATE: () => '',
    MY_GROUPS: () => '',
    GET: (groupId: string) => `/${groupId}`,
    MEMBERS: (groupId: string) => `/${groupId}/members`,
    JOIN: () => '/join',
    REMOVE_MEMBER: (groupId: string) => `/${groupId}/members`,
    UPDATE: (groupId: string) => `/${groupId}`,
    DELETE: (groupId: string) => `/${groupId}`,
    REGENERATE_CODE: (groupId: string) => `/${groupId}/regenerate-code`,
  },

  MEETINGS: {
    BASE_URL: () => '/meetings',
    START: () => '/start',
    END: (meetingId: string) => `/${meetingId}/end`,
    GROUP_MEETINGS: (groupId: string) => `/group/${groupId}`,
    ACTIVE_MEETING: (groupId: string) => `/group/${groupId}/active`,
    GET: (meetingId: string) => `/${meetingId}`,
  },

  CHAT: {
    BASE_URL: () => '/chat',
    SEND_MESSAGE: () => '/messages',
    GROUP_MESSAGES: (groupId: string) => `/groups/${groupId}/messages`,
    TRANSCRIPT: (meetingId: string) => `/meetings/${meetingId}/transcript`,
    SUMMARY: (meetingId: string) => `/meetings/${meetingId}/summary`,
  },

  ROOMS: {
    BASE_URL: () => '/rooms',
    CREATE: () => '',
    JOIN: () => '/join',
    LEAVE: (roomId: string) => `/${roomId}/leave`,
    END: (roomId: string) => `/${roomId}`,
    DETAILS: (roomId: string) => `/${roomId}`,
    PARTICIPANTS: (roomId: string) => `/${roomId}/participants`,
    REMOVE_PARTICIPANT: (roomId: string, participantId: string) =>
      `/${roomId}/participants/${participantId}`,
    USER_ROOMS: () => '',
  },
}
