'use client'

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiClient, ApiError } from '@/lib/api-client'
import type { User } from '@/lib/types'

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (email: string, username: string, password: string) => Promise<string>
  logout: () => Promise<void>
  verify: (email: string, code: string) => Promise<void>
  resendCode: (email: string) => Promise<string>
  refreshSession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const data = await apiClient.get<{ user: User }>('/auth/session')
      setUser(data.user)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshSession().finally(() => setLoading(false))
  }, [refreshSession])

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await apiClient.post<{ user: User }>('/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(
    async (email: string, username: string, password: string): Promise<string> => {
      const data = await apiClient.post<{ message: string }>('/auth/register', {
        email,
        username,
        password,
      })
      return data.message
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }, [])

  const verify = useCallback(async (email: string, code: string) => {
    await apiClient.post('/auth/verify', { email, code })
  }, [])

  const resendCode = useCallback(async (email: string): Promise<string> => {
    const data = await apiClient.post<{ message: string }>('/auth/resend-code', { email })
    return data.message
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, login, register, logout, verify, resendCode, refreshSession }),
    [user, loading, login, register, logout, verify, resendCode, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
