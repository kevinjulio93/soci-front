/**
 * Form Options - Constantes para opciones de formularios
 * Centraliza todas las opciones de select para fácil mantenimiento
 */

// Tipos de identificación
export const ID_TYPE_OPTIONS = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'PA', label: 'Pasaporte (PA)' },
  { value: 'RC', label: 'Registro Civil (RC)' },
  { value: 'NIT', label: 'NIT' },
] as const

// Géneros
export const GENDER_OPTIONS = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Femenino', label: 'Femenino' },
  { value: 'Otro', label: 'Otro' },
  { value: 'Prefiero no decir', label: 'Prefiero no decir' },
] as const

// Rangos de edad
export const AGE_RANGE_OPTIONS = [
  { value: '18-24', label: '18 - 24 años' },
  { value: '25-34', label: '25 - 34 años' },
  { value: '35-44', label: '35 - 44 años' },
  { value: '45-54', label: '45 - 54 años' },
  { value: '55-64', label: '55 - 64 años' },
  { value: '65+', label: '65+ años' },
] as const

// Estratos socioeconómicos
export const STRATUM_OPTIONS = [
  { value: '1', label: '1 - Bajo' },
  { value: '2', label: '2 - Bajo' },
  { value: '3', label: '3 - Medio' },
  { value: '4', label: '4 - Medio' },
  { value: '5', label: '5 - Alto' },
  { value: '6', label: '6 - Muy Alto' },
] as const

// Colores para avatares (basados en hash del nombre)
export const AVATAR_COLORS = [
  '#FFB3BA', // Rosa
  '#FFDFBA', // Naranja claro
  '#FFFFBA', // Amarillo claro
  '#BAFFC9', // Verde claro
  '#BAE1FF', // Azul claro
  '#E0BBE4', // Púrpura claro
  '#957DAD', // Púrpura oscuro
  '#D291BC', // Púrpura rosa
  '#FEC8D8', // Rosa claro
  '#A0C4FF', // Azul claro
] as const
