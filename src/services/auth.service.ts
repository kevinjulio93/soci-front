/**
 * Servicio de Autenticación - Lógica de negocio centralizada
 * Principio: Single Responsibility (solo maneja autenticación)
 * Principio: Dependency Inversion (inyecta dependencias)
 * Composición: Usa apiService y storageService
 */

import type { LoginCredentials, LoginResponse, User } from '../types'
import { apiService } from './api.service'
import { storageService } from './storage.service'

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    const response: LoginResponse = await apiService.login(credentials)

    // La respuesta del backend tiene la estructura: { user: { id, email, role, token, abilities } }
    const user = response.user

    // Validar si el usuario está deshabilitado
    if (user.status === 'disabled') {
      throw new Error('Su cuenta ha sido deshabilitada. No tiene permisos para acceder a la aplicación. Contacte al administrador.')
    }

    // Persistir token y usuario
    storageService.setToken(user.token)
    storageService.setUser(user)

    return user
  }

  async logout(): Promise<void> {
    try {
      // await apiService.logout()
    } finally {
      // Limpiar storage sin importar si falla la llamada al backend
      storageService.clear()
    }
  }

  restoreSession(): User | null {
    const user = storageService.getUser()
    
    // Validar si el usuario está deshabilitado al restaurar sesión
    if (user && user.status === 'disabled') {
      // Limpiar sesión si el usuario está deshabilitado
      storageService.clear()
      return null
    }
    
    return user
  }

  isSessionValid(): boolean {
    return !!storageService.getToken() && !!storageService.getUser()
  }

  getCurrentUser(): User | null {
    return storageService.getUser()
  }

  /**
   * Determina el dashboard a mostrar basado en el rol del usuario
   * 'root', 'admin' o 'coordinador' → /admin/dashboard
   * 'socializer' → /sociologist/dashboard
   * Otros roles → /sociologist/dashboard (por defecto)
   */
  getDashboardRoute(user: User | null): string {
    if (!user) return '/login'
    
    const roleType = user.role?.role?.toLowerCase()
    console.log('🔍 getDashboardRoute - user:', user)
    console.log('🔍 getDashboardRoute - roleType:', roleType)
    
    // Si es root, admin o coordinador, mostrar admin dashboard
    if (roleType === 'root' || roleType === 'admin' || roleType === 'coordinador' || roleType === 'coordinator') {
      console.log('✅ Redirigiendo a /admin/dashboard')
      return '/admin/dashboard'
    }
    
    // Por defecto (socializer y otros), mostrar sociologist dashboard
    console.log('✅ Redirigiendo a /sociologist/dashboard')
    return '/sociologist/dashboard'
  }

  /**
   * Verifica si el usuario es admin, root o coordinador
   */
  isAdminOrRoot(user: User | null): boolean {
    if (!user) return false
    const roleType = user.role?.role?.toLowerCase()
    const isAdmin = roleType === 'root' || roleType === 'admin' || roleType === 'coordinador' || roleType === 'coordinator'
    console.log('🔍 isAdminOrRoot - roleType:', roleType, 'isAdmin:', isAdmin)
    return isAdmin
  }

  /**
   * Verifica si el usuario es socializer
   */
  isSocializer(user: User | null): boolean {
    if (!user) return false
    const roleType = user.role?.role?.toLowerCase()
    return roleType === 'socializer'
  }

  /**
   * Verifica si el usuario está habilitado
   */
  isUserEnabled(user: User | null): boolean {
    if (!user) return false
    return user.status !== 'disabled'
  }

  /**
   * Verifica si el usuario es coordinador
   */
  isCoordinator(user: User | null): boolean {
    if (!user) return false
    const roleType = user.role?.role?.toLowerCase()
    return roleType === 'coordinador' || roleType === 'coordinator'
  }
}

export const authService = new AuthService()
