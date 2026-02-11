/**
 * usePermissions - Hook para verificar permisos del usuario
 * Centraliza la lógica de validación de permisos
 */

import { useAuth } from '../contexts/AuthContext'
import { hasWritePermissions } from '../utils/roleHelpers'

export interface Permissions {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canRead: boolean
  isReadOnly: boolean
}

export function usePermissions(): Permissions {
  const { user } = useAuth()
  const role = user?.role?.role?.toLowerCase() || ''

  const canWrite = hasWritePermissions(role)
  const isReadOnly = role === 'readonly'

  return {
    canCreate: canWrite,
    canEdit: canWrite,
    canDelete: canWrite,
    canRead: true,
    isReadOnly,
  }
}
