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

    // La respuesta del backend tiene la estructura: { user: { id/_id, email, role, token, abilities } }
    let user = response.user
    
    // Si el backend envía _id en lugar de id, mapear correctamente
    if (!user.id && (user as any)._id) {
      user = {
        ...user,
        id: (user as any)._id
      }
    }

    // Validar si el usuario está deshabilitado
    if (user.status === 'disabled') {
      throw new Error('Su cuenta ha sido deshabilitada. No tiene permisos para acceder a la aplicación. Contacte al administrador.')
    }

    // Persistir token primero
    storageService.setToken(user.token)

    // Obtener perfil completo del usuario (incluye fullName y profile)
    try {
      const profileResponse = await apiService.getUserProfile()
      // La respuesta tiene estructura: { data: { user, profile, fullName, profileType } }
      const profileData = (profileResponse as any).data || profileResponse
      user = {
        ...user,
        fullName: profileData.fullName,
        profile: profileData.profile,
        profileType: profileData.profileType
      }
    } catch (error) {
      // Si falla, continuar con los datos básicos del login
      console.warn('No se pudo obtener el perfil completo del usuario:', error)
    }

    // Persistir usuario completo
    storageService.setUser(user)

    return user
  }

  async logout(): Promise<void> {
    
    const token = storageService.getToken()
    
    // PRIMERO: Invalidar el token en el backend (mientras aún está en storage)
    if (token) {
      try {
        await apiService.logout()
      } catch (error) {
        // Si falla el logout en el backend, continuar igual
        console.error('❌ Error al invalidar token en el backend:', error)
      }
    } else {
      console.log('No hay token para invalidar en el backend')
    }
    
    // SEGUNDO: Limpiar el storage local después de invalidar en backend
    storageService.clear()
    
  }

  restoreSession(): User | null {
    let user = storageService.getUser()
    const token = storageService.getToken()
    
    // Debe haber tanto usuario como token
    if (!user || !token) {
      // Si falta alguno, limpiar todo para evitar estados inconsistentes
      if (user || token) {
        storageService.clear()
      }
      return null
    }
    
    // Si el backend envía _id en lugar de id, mapear correctamente
    if (!user.id && (user as any)._id) {
      user = {
        ...user,
        id: (user as any)._id
      }
    }
    
    // Validar si el usuario está deshabilitado al restaurar sesión
    if (user.status === 'disabled') {
      // Limpiar sesión si el usuario está deshabilitado
      storageService.clear()
      return null
    }
    
    return user
  }

  async validateUserStatus(): Promise<{ isValid: boolean; user?: User }> {
    try {
      const response = await apiService.getUserProfile()
      // La respuesta tiene estructura: { data: { user, profile, fullName, profileType } }
      const profileData = (response as any).data || response
      const user = {
        ...profileData.user,
        fullName: profileData.fullName,
        profile: profileData.profile,
        profileType: profileData.profileType
      }

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
   * 'root', 'admin', coordinadores, 'supervisor' o 'readonly' → /admin/dashboard
   * 'socializer' → /sociologist/dashboard
   * Otros roles → /sociologist/dashboard (por defecto)
   */
  getDashboardRoute(user: User | null): string {
    if (!user) return '/login'
    
    const roleType = user.role?.role?.toLowerCase()
    
    // Si es root, admin, cualquier tipo de coordinador, supervisor o readonly, mostrar admin dashboard
    const adminRoles = ['root', 'admin', 'coordinador', 'coordinator', 'zonecoordinator', 'fieldcoordinator', 'supervisor', 'readonly']
    if (adminRoles.includes(roleType || '')) {
      return '/admin/dashboard'
    }
    
    // Por defecto (socializer y otros), mostrar sociologist dashboard
    return '/sociologist/dashboard'
  }

  /**
   * Verifica si el usuario es admin, root, coordinador, supervisor o readonly
   */
  isAdminOrRoot(user: User | null): boolean {
    if (!user) return false
    const roleType = user.role?.role?.toLowerCase()
    const adminRoles = ['root', 'admin', 'coordinador', 'coordinator', 'zonecoordinator', 'fieldcoordinator', 'supervisor', 'readonly']
    return adminRoles.includes(roleType || '')
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
