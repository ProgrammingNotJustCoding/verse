export const API = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  AUTH: {
    BASE_URL: () => '/auth',
    SIGN_UP: () => '/signup',
    LOGIN: () => '/login',
  },
}
