/**
 * roleHelpers - Utilidades para manejo de roles
 * Centraliza lógica de traducción y validación de roles
 */

// Mapeo de roles a español
const ROLE_TRANSLATIONS: Record<string, string> = {
  'admin': 'Administrador',
  'coordinator': 'Coordinador',
  'supervisor': 'Supervisor',
  'socializer': 'Socializador',
  'readonly': 'Solo Lectura',
  'zonecoordinator': 'Coordinador de Zona',
  'fieldcoordinator': 'Coordinador de Campo',
}

/**
 * Traduce un rol del inglés al español
 */
export const translateRole = (role: string): string => {
  return ROLE_TRANSLATIONS[role.toLowerCase()] || role
}

/**
 * Verifica si un rol es de administrador
 */
export const isAdminRole = (role: string): boolean => {
  const normalized = role.toLowerCase()
  return normalized === 'admin' || normalized === 'root'
}

/**
 * Verifica si un rol es de coordinador
 */
export const isCoordinatorRole = (role: string): boolean => {
  const normalized = role.toLowerCase()
  return normalized === 'coordinator' || normalized === 'coordinador' || 
         normalized === 'zonecoordinator' || normalized === 'fieldcoordinator'
}

/**
 * Verifica si un rol es de socializador
 */
export const isSocializerRole = (role: string): boolean => {
  const normalized = role.toLowerCase()
  return normalized === 'socializer' || normalized === 'socializador'
}

/**
 * Verifica si un rol tiene permisos de escritura
 * readonly no puede crear, editar ni eliminar
 */
export const hasWritePermissions = (role: string): boolean => {
  const normalized = role.toLowerCase()
  return normalized !== 'readonly'
}

/**
 * Obtiene el color asociado a un rol
 */
export const getRoleColor = (role: string): string => {
  const normalized = role.toLowerCase()
  
  if (isAdminRole(normalized)) return '#ef4444' // Rojo
  if (isCoordinatorRole(normalized)) return '#3b82f6' // Azul
  if (isSocializerRole(normalized)) return '#10b981' // Verde
  
  return '#6b7280' // Gris por defecto
}
