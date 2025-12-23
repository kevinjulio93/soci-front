/**
 * Constants Index - Punto de entrada centralizado para todas las constantes
 * Facilita la importación de constantes desde cualquier parte de la aplicación
 */

// Opciones de formularios
export {
  ID_TYPE_OPTIONS,
  GENDER_OPTIONS,
  AGE_RANGE_OPTIONS,
  STRATUM_OPTIONS,
  NO_RESPONSE_REASONS,
  AVATAR_COLORS,
} from './formOptions'

// Mensajes
export { MESSAGES } from './messages'

// UI (Títulos y descripciones)
export { TITLES, DESCRIPTIONS } from './ui'

// Table Columns
export { getSurveysTableColumns, getSocializerSurveysTableColumns, getSocializersTableColumns, getRespondentsTableColumns } from './tableColumns'

// Rutas
export { ROUTES } from './routes'

// URLs externas y API endpoints
export { EXTERNAL_URLS, API_ENDPOINTS } from './urls'

// Configuraciones
export { 
  MAP_CONFIG, 
  AUDIO_CONFIG, 
  PAGINATION_CONFIG, 
  TOAST_CONFIG, 
  SYNC_CONFIG,
  FILE_CONFIG,
  LOCALE_CONFIG,
} from './config'
