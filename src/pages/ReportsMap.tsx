/**
 * ReportsMap - Mapa de ubicaciones de encuestas
 * Muestra todas las encuestas en un mapa con marcadores de colores según el estado
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon, LatLngBounds } from 'leaflet'
import { Sidebar } from '../components'
import { apiService } from '../services/api.service'
import { ROUTES, EXTERNAL_URLS, MESSAGES, MAP_CONFIG } from '../constants'
import { notificationService } from '../services/notification.service'
import type { RespondentData } from '../models/ApiResponses'
import 'leaflet/dist/leaflet.css'
import '../styles/Dashboard.scss'

// Componente para ajustar los límites del mapa
function MapBounds({ respondents }: { respondents: RespondentData[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (respondents.length === 0) return
    
    const bounds = new LatLngBounds(
      respondents.map(r => [
        r.location?.coordinates[1] || 0,
        r.location?.coordinates[0] || 0,
      ] as [number, number])
    )
    
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [respondents, map])
  
  return null
}

// Iconos de marcadores estándar de Leaflet con colores diferentes
const successfulIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: EXTERNAL_URLS.LEAFLET_MARKER_SHADOW,
  iconSize: MAP_CONFIG.MARKER_SIZE,
  iconAnchor: MAP_CONFIG.MARKER_ANCHOR,
  popupAnchor: MAP_CONFIG.POPUP_ANCHOR,
  shadowSize: MAP_CONFIG.SHADOW_SIZE
})

const unsuccessfulIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: EXTERNAL_URLS.LEAFLET_MARKER_SHADOW,
  iconSize: MAP_CONFIG.MARKER_SIZE,
  iconAnchor: MAP_CONFIG.MARKER_ANCHOR,
  popupAnchor: MAP_CONFIG.POPUP_ANCHOR,
  shadowSize: MAP_CONFIG.SHADOW_SIZE
})

type FilterType = 'all' | 'successful' | 'unsuccessful'

interface SocializerReport {
  dailyStats: Array<{
    date: string
    totalSurveys: number
    surveys: RespondentData[]
  }>
  allSurveys: RespondentData[]
}

export default function ReportsMap() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [allRespondents, setAllRespondents] = useState<RespondentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [useFilters, setUseFilters] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    unsuccessful: 0,
  })

  // Cargar todas las encuestas
  const loadAllRespondents = async () => {
    try {
      setIsLoading(true)
      // Cargar todas las encuestas (paginación grande para obtener todas)
      const response = await apiService.getRespondents(1, 10000)
      
      // Filtrar solo las que tienen ubicación válida
      const respondentsWithLocation = response.data.filter(
        r => r.location && 
             r.location.coordinates && 
             r.location.coordinates.length === 2 &&
             r.location.coordinates[0] !== 0 && 
             r.location.coordinates[1] !== 0
      )
      
      setAllRespondents(respondentsWithLocation)
      
      // Calcular estadísticas
      const successful = respondentsWithLocation.filter(
        r => r.willingToRespond === true
      ).length
      const unsuccessful = respondentsWithLocation.filter(
        r => r.willingToRespond === false
      ).length
      
      setStats({
        total: respondentsWithLocation.length,
        successful,
        unsuccessful,
      })
    } catch (error) {
      notificationService.handleApiError(error, MESSAGES.RESPONDENT_LOAD_ERROR)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar encuestas filtradas por fecha
  const loadFilteredRespondents = async () => {
    if (!startDate || !endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }

    try {
      setIsLoading(true)
      const response = await apiService.getReportsBySocializerAndDate(
        startDate,
        endDate
      )

      // Extraer todas las encuestas de todos los socializadores
      const allSurveys: RespondentData[] = []
      response.data.report.forEach((socializerReport: SocializerReport) => {
        allSurveys.push(...socializerReport.allSurveys)
      })

      // Filtrar solo las que tienen ubicación válida
      const respondentsWithLocation = allSurveys.filter(
        r => r.location && 
             r.location.coordinates && 
             r.location.coordinates.length === 2 &&
             r.location.coordinates[0] !== 0 && 
             r.location.coordinates[1] !== 0
      )

      setAllRespondents(respondentsWithLocation)

      // Calcular estadísticas
      const successful = respondentsWithLocation.filter(
        r => r.willingToRespond === true
      ).length
      const unsuccessful = respondentsWithLocation.filter(
        r => r.willingToRespond === false
      ).length

      setStats({
        total: respondentsWithLocation.length,
        successful,
        unsuccessful,
      })

      setUseFilters(true)
      notificationService.success('Encuestas filtradas correctamente')
    } catch (error) {
      notificationService.handleApiError(error, 'Error al filtrar encuestas')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar todas las encuestas al inicio
  useEffect(() => {
    loadAllRespondents()
  }, [])

  const handleBackToReports = () => {
    navigate(ROUTES.ADMIN_REPORTS)
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setUseFilters(false)
    loadAllRespondents()
  }

  const handleApplyFilters = () => {
    loadFilteredRespondents()
  }

  // Filtrar encuestas según el filtro activo
  const filteredRespondents = allRespondents.filter(r => {
    if (filter === 'all') return true
    if (filter === 'successful') return r.willingToRespond === true
    if (filter === 'unsuccessful') return r.willingToRespond === false
    return true
  })

  // Calcular el centro del mapa basado en todas las ubicaciones
  const mapCenter: [number, number] = allRespondents.length > 0
    ? [
        allRespondents.reduce((sum, r) => sum + (r.location?.coordinates[1] || 0), 0) / allRespondents.length,
        allRespondents.reduce((sum, r) => sum + (r.location?.coordinates[0] || 0), 0) / allRespondents.length,
      ]
    : [10.9685, -74.7813] // Barranquilla por defecto

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="dashboard-layout__content">
        <div className="dashboard-layout__header">
          <button 
            className="dashboard-layout__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="dashboard-layout__title">Mapa de Encuestas</h1>
          <div className="dashboard-layout__actions">
            <button className="btn btn--secondary" onClick={handleBackToReports}>
              ← Volver a Reportes
            </button>
          </div>
        </div>

        <div className="dashboard-layout__body">
          {/* Filtros de fecha */}
          <div className="filters-container" style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', fontWeight: '600' }}>
              Filtrar por Rango de Fechas
            </h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', fontWeight: '500' }}>
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    color: '#1f2937',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', fontWeight: '500' }}>
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    color: '#1f2937',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn--primary"
                  onClick={handleApplyFilters}
                  disabled={!startDate || !endDate || isLoading}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Aplicar Filtros
                </button>
                {useFilters && (
                  <button 
                    className="btn btn--secondary"
                    onClick={handleClearFilters}
                    disabled={isLoading}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Limpiar Filtros
                  </button>
                )}
              </div>
            </div>
            {useFilters && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                background: '#f0f9ff', 
                borderRadius: '4px',
                fontSize: '14px',
                color: '#0369a1'
              }}>
                📅 Mostrando encuestas del {new Date(startDate).toLocaleDateString('es-ES')} al {new Date(endDate).toLocaleDateString('es-ES')}
              </div>
            )}
          </div>

          {/* Estadísticas con filtros clickeables */}
          <div className="reports-stats">
            <div 
              className={`stat-card ${filter === 'all' ? 'stat-card--active' : ''}`}
              onClick={() => setFilter('all')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-card__value">{stats.total}</div>
              <div className="stat-card__label">Total de Encuestas</div>
            </div>
            <div 
              className={`stat-card stat-card--success ${filter === 'successful' ? 'stat-card--active' : ''}`}
              onClick={() => setFilter('successful')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-card__icon">
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}></div>
              </div>
              <div className="stat-card__value">{stats.successful}</div>
              <div className="stat-card__label">Exitosas</div>
            </div>
            <div 
              className={`stat-card stat-card--danger ${filter === 'unsuccessful' ? 'stat-card--active' : ''}`}
              onClick={() => setFilter('unsuccessful')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-card__icon">
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}></div>
              </div>
              <div className="stat-card__value">{stats.unsuccessful}</div>
              <div className="stat-card__label">Rechazadas</div>
            </div>
          </div>

          {/* Mapa */}
          {isLoading ? (
            <div className="loading-container">
              <p>{MESSAGES.LOADING_DATA}</p>
            </div>
          ) : allRespondents.length === 0 ? (
            <div className="empty-state">
              <p>No hay encuestas con ubicación registrada</p>
            </div>
          ) : (
            <div className="map-container">
              <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution={EXTERNAL_URLS.LEAFLET_ATTRIBUTION}
                  url={EXTERNAL_URLS.LEAFLET_TILE_URL}
                />
                
                <MapBounds respondents={filteredRespondents} />
                
                {filteredRespondents.map((respondent) => {
                  const isSuccessful = respondent.willingToRespond === true
                  const icon = isSuccessful ? successfulIcon : unsuccessfulIcon
                  
                  // Extraer coordenadas del objeto location
                  // MongoDB GeoJSON: coordinates = [longitude, latitude]
                  const longitude = respondent.location?.coordinates[0] || 0
                  const latitude = respondent.location?.coordinates[1] || 0
                  
                  return (
                    <Marker
                      key={respondent._id}
                      position={[latitude, longitude]}
                      icon={icon}
                    >
                      <Popup>
                        <div style={{ minWidth: '200px' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                            {respondent.fullName || 'No proporcionado'}
                          </h4>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                            <strong>Estado:</strong>{' '}
                            <span style={{ color: isSuccessful ? '#3b82f6' : '#ef4444' }}>
                              {isSuccessful ? 'Exitosa' : 'Rechazada'}
                            </span>
                          </div>
                          {!isSuccessful && respondent.rejectionReason && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                              <strong>Razón:</strong> {respondent.rejectionReason}
                            </div>
                          )}
                          {respondent.neighborhood && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                              <strong>Barrio:</strong> {respondent.neighborhood}
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            <strong>Fecha:</strong>{' '}
                            {new Date(respondent.createdAt).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
