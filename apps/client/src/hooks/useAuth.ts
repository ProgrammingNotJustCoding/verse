import { useState, useEffect, useCallback } from 'react'
import {
  isAuthenticated,
  getAuthToken,
  removeAuthToken,
  type SignUpData,
  type LoginData,
  signUp as authSignUp,
  login as authLogin,
  isAuthError,
  getAuthErrorMessage,
} from '../services/auth.service'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const [isAuth, setIsAuth] = useState(isAuthenticated())
  const [token, setToken] = useState<string | null>(getAuthToken())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      const currentToken = getAuthToken()
      setIsAuth(authenticated)
      setToken(currentToken)
    }

    checkAuth()

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Sign up function
  const signUp = useCallback(
    async (data: SignUpData) => {
      setLoading(true)
      setError(null)

      try {
        const response = await authSignUp(data)

        if (isAuthError(response)) {
          const errorMessage = getAuthErrorMessage(response)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        // Update state
        setIsAuth(true)
        setToken(response.data.token)

        return { success: true, data: response.data }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Login function
  const login = useCallback(
    async (data: LoginData) => {
      setLoading(true)
      setError(null)

      try {
        const response = await authLogin(data)

        if (isAuthError(response)) {
          const errorMessage = getAuthErrorMessage(response)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        // Update state
        setIsAuth(true)
        setToken(response.data.token)

        return { success: true, data: response.data }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Logout function
  const logout = useCallback(() => {
    removeAuthToken()
    setIsAuth(false)
    setToken(null)
    setError(null)
    navigate('/auth')
  }, [navigate])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isAuthenticated: isAuth,
    token,
    loading,
    error,
    signUp,
    login,
    logout,
    clearError,
  }
}
