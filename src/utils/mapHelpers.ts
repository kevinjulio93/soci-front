/**
 * Map Utilities - Funciones reutilizables para componentes de mapa
 */

import { RespondentData } from '../models/ApiResponses'

/**
 * Filtra respondents que tienen ubicación válida
 */
export const filterRespondentsWithLocation = (respondents: RespondentData[]): RespondentData[] => {
  return respondents.filter(
    r => r.location && 
         r.location.coordinates && 
         r.location.coordinates.length === 2 &&
         r.location.coordinates[0] !== 0 && 
         r.location.coordinates[1] !== 0
  )
}

/**
 * Calcula el centro geográfico de un conjunto de respondents
 */
export const calculateMapCenter = (
  respondents: RespondentData[],
  defaultCenter: [number, number] = [10.9685, -74.7813]
): [number, number] => {
  if (respondents.length === 0) return defaultCenter

  const avgLat = respondents.reduce((sum, r) => sum + (r.location?.coordinates[1] || 0), 0) / respondents.length
  const avgLng = respondents.reduce((sum, r) => sum + (r.location?.coordinates[0] || 0), 0) / respondents.length

  return [avgLat, avgLng]
}

/**
 * Calcula estadísticas de encuestas
 */
export const calculateSurveyStats = (respondents: RespondentData[]) => {
  const successful = respondents.filter(r => r.willingToRespond === true).length
  const unsuccessful = respondents.filter(r => r.willingToRespond === false).length

  return {
    total: respondents.length,
    successful,
    unsuccessful,
  }
}

/**
 * Extrae coordenadas de un respondent (maneja formato GeoJSON de MongoDB)
 */
export const extractCoordinates = (respondent: RespondentData): [number, number] => {
  const longitude = respondent.location?.coordinates[0] || 0
  const latitude = respondent.location?.coordinates[1] || 0
  return [latitude, longitude] // Leaflet usa [lat, lng]
}
