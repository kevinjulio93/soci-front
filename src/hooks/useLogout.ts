/**
 * useLogout - Hook personalizado para manejar logout
 * Centraliza toda la lógica de cierre de sesión en un solo lugar
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../constants'

export interface UseLogoutOptions {
  onBeforeLogout?: () => Promise<void> | void
}

export function useLogout(options?: UseLogoutOptions) {
  const navigate = useNavigate()
  const { logout: authLogout } = useAuth()

  const handleLogout = async () => {
    
    try {
      // Ejecutar callback antes de logout si existe (ej: detener grabación)
      if (options?.onBeforeLogout) {
        await options.onBeforeLogout()
      }

      // Ejecutar logout (limpia storage y llama al backend)
      await authLogout()
      
      navigate(ROUTES.LOGIN)
    } catch (error) {
      console.error('useLogout: Error al cerrar sesión:', error)
      // Navegar a login incluso si hay error
      navigate(ROUTES.LOGIN)
    }
    
  }

  return handleLogout
}
