/**
 * AuthContext refactorizado - Solo maneja estado UI
 * Principio: Single Responsibility (solo estado, no lógica de negocio)
 * Las servicios están separados y pueden ser reusados en cualquier contexto
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { AuthState, User } from '../types'
import { authService } from '../services/auth.service'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  isLoading: boolean
  isLoggingOut: boolean
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
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Restaurar sesión al montar
  useEffect(() => {
    const restoreSession = async () => {
      const user = authService.restoreSession()
      if (user) {
        const token = localStorage.getItem('soci_token')
        setAuthState({
          user,
          token: token || null,
          isAuthenticated: true,
        })
        
        // Validar el estado del usuario después de restaurar
        const result = await authService.validateUserStatus()
        if (!result.isValid) {
          // Usuario deshabilitado o sesión inválida
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
          })
          setError('Su cuenta ha sido deshabilitada. Por favor contacte al administrador.')
        }
      }
      
      setIsLoading(false)
    }

    restoreSession()
  }, [])

  // Validar estatus del usuario periódicamente (cada 5 minutos)
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user) {
      return
    }

    const validateStatus = async () => {
      const result = await authService.validateUserStatus()
      
      if (!result.isValid) {
        // Usuario deshabilitado o sesión inválida - hacer logout
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        setError('Su cuenta ha sido deshabilitada. Por favor contacte al administrador.')
      }
    }

    // Validar cada 5 minutos
    const interval = setInterval(validateStatus, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [authState.isAuthenticated])

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
    setIsLoggingOut(true)
    try {
      // Llamar al servicio de logout (limpia storage Y llama al endpoint)
      await authService.logout()
      
      // Actualizar estado
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
      })
    } catch (err) {
      console.error('AuthContext: Error en logout:', err)
      const message = err instanceof Error ? err.message : 'Error al cerrar sesión'
      setError(message)
      
      // Limpiar estado incluso si hay error
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
      })
    } finally {
      setIsLoggingOut(false)
    }
  }, [])

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    isLoading,
    isLoggingOut,
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
