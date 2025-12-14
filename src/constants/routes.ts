/**
 * Routes - Constantes de rutas de navegación
 * Centraliza todas las rutas de la aplicación
 */

export const ROUTES = {
  // Autenticación
  LOGIN: '/login',
  
  // Dashboard
  DASHBOARD: '/sociologist/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  
  // Encuestas
  SURVEY_PARTICIPANT: '/survey',
  NEW_SURVEY: '/survey/new',
  EDIT_SURVEY: '/survey/edit',
} as const
