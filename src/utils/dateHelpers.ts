/**
 * Date Utilities - Funciones para manejo de fechas
 */

/**
 * Formatea una fecha a formato local español
 */
export const formatDateES = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('es-ES')
}

/**
 * Formatea una fecha a formato ISO (YYYY-MM-DD)
 */
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

/**
 * Obtiene la fecha actual en formato ISO
 */
export const getTodayISO = (): string => {
  return formatDateISO(new Date())
}

/**
 * Obtiene una fecha N días antes/después en formato ISO
 */
export const getDateOffsetISO = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return formatDateISO(date)
}

/**
 * Valida que startDate sea menor o igual que endDate
 */
export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return false
  return new Date(startDate) <= new Date(endDate)
}
