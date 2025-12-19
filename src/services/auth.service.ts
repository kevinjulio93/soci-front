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

  async validateUserStatus(): Promise<{ isValid: boolean; user?: User }> {
    try {
      const response = await apiService.getUserProfile()
      const user = response.user

      // Si el usuario está deshabilitado, limpiar sesión
      if (user.status === 'disabled') {
        storageService.clear()
        return { isValid: false }
      }

      // Actualizar usuario en storage con datos frescos del backend
      storageService.setUser(user)
      return { isValid: true, user }
    } catch (error) {
      // Solo limpiar sesión si es un error de autenticación (401, 403)
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as { code: string }
        if (apiError.code === '401' || apiError.code === '403') {
          storageService.clear()
          return { isValid: false }
        }
      }
      
      // Para otros errores (red, servidor caído, etc), mantener la sesión
      // y asumir que el usuario sigue siendo válido
      return { isValid: true }
    }
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
    
    // Si es root, admin o coordinador, mostrar admin dashboard
    if (roleType === 'root' || roleType === 'admin' || roleType === 'coordinador' || roleType === 'coordinator') {
      return '/admin/dashboard'
    }
    
    // Por defecto (socializer y otros), mostrar sociologist dashboard
    return '/sociologist/dashboard'
  }

  /**
   * Verifica si el usuario es admin, root o coordinador
   */
  isAdminOrRoot(user: User | null): boolean {
    if (!user) return false
    const roleType = user.role?.role?.toLowerCase()
    const isAdmin = roleType === 'root' || roleType === 'admin' || roleType === 'coordinador' || roleType === 'coordinator'
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
