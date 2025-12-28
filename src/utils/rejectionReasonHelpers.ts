/**
 * rejectionReasonHelpers - Utilidades para manejo de razones de rechazo
 * Centraliza lógica de extracción y formateo de razones
 */

import type { RejectionReasonValue } from '../types/common'

/**
 * Extrae el label de una razón de rechazo
 * Maneja múltiples formatos: objeto {label, value}, string, null
 */
export const getRejectionReasonLabel = (
  reason: RejectionReasonValue,
  defaultValue: string = 'No especificada'
): string => {
  if (!reason) return defaultValue
  
  // Si es un objeto con label
  if (typeof reason === 'object' && 'label' in reason && reason.label) {
    return reason.label
  }
  
  // Si es un string directo
  if (typeof reason === 'string') {
    return reason
  }
  
  return defaultValue
}

/**
 * Extrae el value de una razón de rechazo
 */
export const getRejectionReasonValue = (
  reason: RejectionReasonValue,
  defaultValue: string = ''
): string => {
  if (!reason) return defaultValue
  
  // Si es un objeto con value
  if (typeof reason === 'object' && 'value' in reason && reason.value) {
    return reason.value
  }
  
  // Si es un string directo
  if (typeof reason === 'string') {
    return reason
  }
  
  return defaultValue
}

/**
 * Obtiene la razón de no respuesta desde múltiples fuentes
 * Prioriza noResponseReason sobre rejectionReason
 */
export const getNoResponseReason = (data: {
  noResponseReason?: RejectionReasonValue
  rejectionReason?: RejectionReasonValue
}): string => {
  // Intentar primero con noResponseReason
  if (data.noResponseReason) {
    return getRejectionReasonLabel(data.noResponseReason)
  }
  
  // Luego con rejectionReason
  if (data.rejectionReason) {
    return getRejectionReasonLabel(data.rejectionReason)
  }
  
  return 'No especificada'
}
