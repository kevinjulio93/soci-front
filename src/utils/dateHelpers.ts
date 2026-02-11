/**
 * Date Utilities - Funciones para manejo de fechas
 */

/**
 * Formatea una fecha a formato local español
 * Maneja correctamente fechas ISO (YYYY-MM-DD) evitando desplazamientos de timezone
 */
export const formatDateES = (date: string | Date): string => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Para fechas ISO (YYYY-MM-DD), parsear manualmente para evitar timezone issues
    const [year, month, day] = date.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('es-ES')
  }
  return new Date(date).toLocaleDateString('es-ES')
}

/**
 * Formatea una fecha a formato ISO (YYYY-MM-DD) en zona horaria local
 * Evita problemas de UTC desplazando la fecha
 */
export const formatDateISO = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Obtiene la fecha actual en formato ISO usando zona horaria local
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
