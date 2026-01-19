import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi, tokenStorage } from '@/api'
import type { User, LoginRequest, RegisterRequest } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: User) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })
  const queryClient = useQueryClient()

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenStorage.getAccessToken()
      if (!token) {
        setState({ user: null, isAuthenticated: false, isLoading: false })
        return
      }

      try {
        const user = await authApi.getProfile()
        setState({ user, isAuthenticated: true, isLoading: false })
      } catch {
        tokenStorage.clearTokens()
        setState({ user: null, isAuthenticated: false, isLoading: false })
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data)
    setState({ user: response.user, isAuthenticated: true, isLoading: false })
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    await authApi.register(data)
    // Note: After registration, user needs to verify email before logging in
    // So we don't set auth state here
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setState({ user: null, isAuthenticated: false, isLoading: false })
    // Clear all cached queries
    queryClient.clear()
  }, [queryClient])

  const updateUser = useCallback((user: User) => {
    setState((prev) => ({ ...prev, user }))
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const user = await authApi.getProfile()
      setState((prev) => ({ ...prev, user }))
    } catch {
      // If refresh fails, logout
      await logout()
    }
  }, [logout])

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
