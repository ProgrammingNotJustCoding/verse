import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  isAuthenticated,
  getAuthToken,
  removeAuthToken,
  signUp as authSignUp,
  login as authLogin,
  isAuthError,
  getAuthErrorMessage,
  type SignUpData,
  type LoginData,
} from '../services/auth.service'

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  loading: boolean
  error: string | null
  signUp: (
    data: SignUpData
  ) => Promise<{ success: boolean; error?: string; data?: { token: string } }>
  login: (
    data: LoginData
  ) => Promise<{ success: boolean; error?: string; data?: { token: string } }>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuth, setIsAuth] = useState(isAuthenticated())
  const [token, setToken] = useState<string | null>(getAuthToken())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      const currentToken = getAuthToken()
      setIsAuth(authenticated)
      setToken(currentToken)
    }

    checkAuth()

    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const signUp = useCallback(async (data: SignUpData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await authSignUp(data)

      if (isAuthError(response)) {
        const errorMessage = getAuthErrorMessage(response)
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: errorMessage }
      }

      setIsAuth(true)
      setToken(response.data.token)
      setLoading(false)
      return { success: true, data: response.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
      setError(errorMessage)
      setLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [])

  const login = useCallback(async (data: LoginData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await authLogin(data)

      if (isAuthError(response)) {
        const errorMessage = getAuthErrorMessage(response)
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: errorMessage }
      }

      setIsAuth(true)
      setToken(response.data.token)
      setLoading(false)
      return { success: true, data: response.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      setLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [])

  const logout = useCallback(() => {
    removeAuthToken()
    setIsAuth(false)
    setToken(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: AuthContextType = {
    isAuthenticated: isAuth,
    token,
    loading,
    error,
    signUp,
    login,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
