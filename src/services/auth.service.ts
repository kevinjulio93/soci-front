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
    return storageService.getUser()
  }

  isSessionValid(): boolean {
    return !!storageService.getToken() && !!storageService.getUser()
  }

  getCurrentUser(): User | null {
    return storageService.getUser()
  }

  /**
   * Determina el dashboard a mostrar basado en el rol del usuario
   * 'root' o 'admin' → /admin/dashboard
   * 'socializer' → /sociologist/dashboard
   * Otros roles → /sociologist/dashboard (por defecto)
   */
  getDashboardRoute(user: User | null): string {
    if (!user) return '/login'
    
    const roleType = user.role?.role?.toLowerCase()
    console.log('🔍 getDashboardRoute - user:', user)
    console.log('🔍 getDashboardRoute - roleType:', roleType)
    
    // Si es root o admin, mostrar admin dashboard
    if (roleType === 'root' || roleType === 'admin') {
      console.log('✅ Redirigiendo a /admin/dashboard')
      return '/admin/dashboard'
    }
    
    // Por defecto (socializer y otros), mostrar sociologist dashboard
    console.log('✅ Redirigiendo a /sociologist/dashboard')
    return '/sociologist/dashboard'
  }

  /**
   * Verifica si el usuario es admin o root
   */
  isAdminOrRoot(user: User | null): boolean {
    if (!user) return false
    const roleType = user.role?.role?.toLowerCase()
    const isAdmin = roleType === 'root' || roleType === 'admin'
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
}

export const authService = new AuthService()
