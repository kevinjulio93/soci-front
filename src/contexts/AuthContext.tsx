/**
 * AuthContext refactorizado - Solo maneja estado UI
 * Principio: Single Responsibility (solo estado, no lógica de negocio)
 * Las servicios están separados y pueden ser reusados en cualquier contexto
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { AuthState, User } from '../types'
import { authService } from '../services/auth.service'
import { storageService } from '../services/storage.service'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Restaurar sesión al montar
  useEffect(() => {
    const restoreSession = () => {
      const user = authService.restoreSession()
      if (user) {
        setAuthState({
          user,
          token: localStorage.getItem('soci_token') || null,
          isAuthenticated: true,
        })
      }
      setIsLoading(false)
    }

    restoreSession()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setIsLoading(true)
    setError(null)

    try {
      const user = await authService.login({ email, password })
      const token = localStorage.getItem('soci_token')
      
      setAuthState({
        user,
        token,
        isAuthenticated: true,
      })

      return user
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      // Limpiar solo localStorage
      storageService.clear()
      
      // Actualizar estado
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cerrar sesión'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    isLoading,
    error,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook personalizado para usar AuthContext
 * Lanza error si se usa fuera del proveedor
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}
