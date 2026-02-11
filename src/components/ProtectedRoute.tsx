/**
 * ProtectedRoute - Componente de orden superior (HOC)
 * Principio: Single Responsibility (solo validación de permisos)
 * Reutilizable y fácil de testear
 */

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/auth.service'
import { LoadingState } from './LoadingState'

interface ProtectedRouteProps {
  children: ReactNode
  allowedSubjects?: string[] // subjects permitidos (ej: ['admins', 'surveys'])
  requireAdminRole?: boolean // requiere que sea admin o root
  requireSocializerRole?: boolean // requiere que sea socializer
}

export function ProtectedRoute({
  children,
  allowedSubjects,
  requireAdminRole = false,
  requireSocializerRole = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isLoggingOut } = useAuth()

  // Mostrar mensaje específico al cerrar sesión
  if (isLoggingOut) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <LoadingState message="Cerrando sesión..." />
      </div>
    )
  }

  // Mostrar loading mientras se restaura la sesión
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <LoadingState message="Cargando sesión..." />
      </div>
    )
  }

  // No autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Validar si el usuario está deshabilitado
  if (user.status === 'disabled') {
    // Redirigir al login - el AuthContext se encargará de limpiar la sesión
    return <Navigate to="/login" replace />
  }

  // Validar que sea admin si se requiere
  if (requireAdminRole) {
    const isAdmin = authService.isAdminOrRoot(user)

    if (!isAdmin) {
      return <Navigate to="/sociologist/dashboard" replace />
    }
  }

  // Validar que sea socializer si se requiere
  if (requireSocializerRole) {
    const isSocializer = authService.isSocializer(user)

    if (!isSocializer) {
      return <Navigate to="/admin/dashboard" replace />
    }
  }

  // Verificar permisos si se especifican
  if (allowedSubjects && allowedSubjects.length > 0) {
    const hasPermission = user.abilities?.some(ability =>
      allowedSubjects.includes(ability.subject)
    )

    if (!hasPermission) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
