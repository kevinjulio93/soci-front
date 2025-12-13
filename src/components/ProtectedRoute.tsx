/**
 * ProtectedRoute - Componente de orden superior (HOC)
 * Principio: Single Responsibility (solo validación de permisos)
 * Reutilizable y fácil de testear
 */

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/auth.service'

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
  const { user, isAuthenticated, isLoading } = useAuth()

  // Mostrar loading mientras se restaura la sesión
  if (isLoading) {
    return <div>Cargando...</div>
  }

  // No autenticado
  if (!isAuthenticated || !user) {
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
