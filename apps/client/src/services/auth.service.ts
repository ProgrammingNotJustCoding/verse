import { API } from '../utils/api'


export interface AuthResponse {
  data: {
    token: string
  }
}

export interface AuthError {
  error: {
    code: number
    message: string
    prettyMessage: string
  }
}

export interface SignUpData {
  name: string
  email: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}


export const TOKEN_KEY = 'token'

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

export const isAuthenticated = (): boolean => {
  return !!getAuthToken()
}


export async function signUp(data: SignUpData): Promise<AuthResponse | AuthError> {
  try {
    const res = await fetch(`${API.BASE_URL}${API.AUTH.BASE_URL()}${API.AUTH.SIGN_UP()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()

    if (!res.ok) {
      return json as AuthError
    }

    
    if (json.data?.token) {
      setAuthToken(json.data.token)
    }

    return json as AuthResponse
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      error: {
        code: 500,
        message: 'Network error',
        prettyMessage: 'Failed to connect to server. Please try again.',
      },
    }
  }
}

export async function login(data: LoginData): Promise<AuthResponse | AuthError> {
  try {
    const res = await fetch(`${API.BASE_URL}${API.AUTH.BASE_URL()}${API.AUTH.LOGIN()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()

    if (!res.ok) {
      return json as AuthError
    }

    
    if (json.data?.token) {
      setAuthToken(json.data.token)
    }

    return json as AuthResponse
  } catch (error) {
    console.error('Login error:', error)
    return {
      error: {
        code: 500,
        message: 'Network error',
        prettyMessage: 'Failed to connect to server. Please try again.',
      },
    }
  }
}

export function logout(): void {
  removeAuthToken()
}


export function isAuthError(response: AuthResponse | AuthError): response is AuthError {
  return 'error' in response
}


export function getAuthErrorMessage(response: AuthError): string {
  return response.error.prettyMessage || response.error.message || 'An error occurred'
}


export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface UserResponse {
  data: {
    user: User
  }
}


export async function getCurrentUser(): Promise<UserResponse | AuthError> {
  const token = getAuthToken()

  if (!token) {
    return {
      error: {
        code: 401,
        message: 'No token found',
        prettyMessage: 'You must be logged in to access this resource.',
      },
    }
  }

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/me`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const json = await res.json()

    if (!res.ok) {
      return json as AuthError
    }

    return json as UserResponse
  } catch (error) {
    console.error('Get user error:', error)
    return {
      error: {
        code: 500,
        message: 'Network error',
        prettyMessage: 'Failed to fetch user profile. Please try again.',
      },
    }
  }
}
