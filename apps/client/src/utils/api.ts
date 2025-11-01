export const API = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  AUTH: {
    BASE_URL: () => '/auth',
    SIGN_UP: () => '/signup',
    LOGIN: () => '/login',
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
