/**
 * ProtectedRoute - Componente de orden superior (HOC)
 * Principio: Single Responsibility (solo validación de permisos)
 * Reutilizable y fácil de testear
 */

import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/auth.service'
import { LoadingState } from './LoadingState'
import { ROUTES, SUPERADMIN_ALLOWED_ADMIN_ROUTES } from '../constants'

interface ProtectedRouteProps {
  children: ReactNode
  allowedSubjects?: string[] // subjects permitidos (ej: ['admins', 'surveys'])
  allowedRoles?: string[] // roles permitidos (ej: ['admin', 'coordinador_zona'])
  requireAdminRole?: boolean // requiere que sea admin o root
  requireSocializerRole?: boolean // requiere que sea socializer
}

export function ProtectedRoute({
  children,
  allowedSubjects,
  allowedRoles,
  requireAdminRole = false,
  requireSocializerRole = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isLoggingOut } = useAuth()
  const location = useLocation()

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

  // Restricción especial: superadmin solo puede ver rutas admin explícitamente permitidas
  const roleType = user.role?.role?.toLowerCase() || ''
  const isAdminRoute = location.pathname.startsWith('/admin')
  if (roleType === 'superadmin' && isAdminRoute) {
    const isAllowedForSuperadmin = SUPERADMIN_ALLOWED_ADMIN_ROUTES.some((route) =>
      location.pathname.startsWith(route)
    )

    if (!isAllowedForSuperadmin) {
      return <Navigate to={ROUTES.ADMIN_REPORTS_SOCIALIZERS} replace />
    }
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

  // Verificar roles si se especifican
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(roleType)

    if (!hasRole) {
      return <Navigate to="/admin/dashboard" replace />
    }
  }

  return <>{children}</>
}
