/**
 * Utils - Funciones utilitarias reutilizables
 * Funciones puras sin dependencias del estado del componente
 */

import { AVATAR_COLORS } from '../constants/formOptions'

/**
 * Obtiene un color de avatar basado en el hash del nombre
 * @param name - Nombre del usuario
 * @returns Color hexadecimal del avatar
 */
export function getAvatarColor(name: string | undefined | null): string {
  if (!name || typeof name !== 'string' || name.length === 0) {
    return AVATAR_COLORS[0]
  }
  const hash = name.charCodeAt(0) + (name.length > 1 ? name.charCodeAt(1) : 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/**
 * Obtiene las iniciales de un nombre (máximo 2 caracteres)
 * @param name - Nombre completo del usuario
 * @returns Iniciales en mayúsculas
 */
export function getInitials(name: string | undefined | null): string {
  if (!name || typeof name !== 'string' || name.length === 0) {
    return 'N/A'
  }
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'N/A'
}

/**
 * Genera un hash simple a partir de un string
 * @param str - String a hashear
 * @returns Número hash
 */
export function simpleHash(str: string): number {
  if (!str || typeof str !== 'string') {
    return 0
  }
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

/**
 * Selecciona un elemento de un array basado en el hash de un string
 * @param str - String para generar el hash
 * @param array - Array del cual seleccionar
 * @returns Elemento seleccionado del array
 */
export function selectFromArrayByHash<T>(str: string, array: T[]): T {
  const hash = simpleHash(str)
  return array[hash % array.length]
}

/**
 * Obtiene el primer nombre de un nombre completo en mayúsculas
 * @param fullName - Nombre completo
 * @returns Primer nombre en mayúsculas
 */
export function getFirstName(fullName: string | undefined | null): string {
  if (!fullName || typeof fullName !== 'string' || fullName.length === 0) {
    return 'N/A'
  }
  return fullName.split(' ')[0].toUpperCase()
}
