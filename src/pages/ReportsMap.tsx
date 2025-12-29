/**
 * ReportsMap - Mapa de ubicaciones de encuestas
 * Muestra todas las encuestas en un mapa con marcadores de colores según el estado
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import { Icon, LatLngBounds } from 'leaflet'
import { Sidebar, DateInput } from '../components'
import { apiService } from '../services/api.service'
import { ROUTES, EXTERNAL_URLS, MESSAGES, MAP_CONFIG } from '../constants'
import { notificationService } from '../services/notification.service'
import { 
  filterRespondentsWithLocation, 
  calculateMapCenter, 
  calculateSurveyStats,
  extractCoordinates,
  formatDateES 
} from '../utils'
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

type FilterType = 'all' | 'successful' | 'unsuccessful' | 'defensores'

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
    defensores: 0,
  })

  // Cargar todas las encuestas
  const loadAllRespondents = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getRespondents(1, 10000)
      
      console.log('📊 Total encuestas recibidas:', response.data.length)
      console.log('📊 Encuestas con location:', response.data.filter(r => r.location).length)
      console.log('📊 Encuestas con coordenadas no [0,0]:', response.data.filter(r => 
        r.location && 
        r.location.coordinates && 
        r.location.coordinates.length === 2 &&
        r.location.coordinates[0] !== 0 && 
        r.location.coordinates[1] !== 0
      ).length)
      
      const respondentsWithLocation = filterRespondentsWithLocation(response.data)
      setAllRespondents(respondentsWithLocation)
      const newStats = calculateSurveyStats(respondentsWithLocation)
      const defensoresCount = respondentsWithLocation.filter(r => (r as any).isPatriaDefender === true).length
      setStats({ ...newStats, defensores: defensoresCount })
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
      const response = await apiService.getReportsBySocializerAndDate(startDate, endDate)

      const allSurveys: RespondentData[] = []
      response.data.report.forEach((socializerReport: SocializerReport) => {
        allSurveys.push(...socializerReport.allSurveys)
      })

      const respondentsWithLocation = filterRespondentsWithLocation(allSurveys)
      setAllRespondents(respondentsWithLocation)
      const newStats = calculateSurveyStats(respondentsWithLocation)
      const defensoresCount = respondentsWithLocation.filter(r => (r as any).isPatriaDefender === true).length
      setStats({ ...newStats, defensores: defensoresCount })
      setUseFilters(true)
      
      notificationService.success('Encuestas filtradas correctamente')
    } catch (error) {
      notificationService.handleApiError(error, 'Error al filtrar encuestas')
    } finally {
      setIsLoading(false)
    }
  }

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

  const filteredRespondents = allRespondents.filter(r => {
    if (filter === 'all') return true
    if (filter === 'successful') return r.willingToRespond === true
    if (filter === 'unsuccessful') return r.willingToRespond === false
    if (filter === 'defensores') return (r as any).isPatriaDefender === true
    return true
  })

  const mapCenter = calculateMapCenter(allRespondents)
  
  // Aplicar pequeño offset a marcadores que comparten la misma ubicación
  const getAdjustedPosition = (respondent: RespondentData, index: number, allData: RespondentData[]): [number, number] => {
    const [lat, long] = extractCoordinates(respondent)
    
    // Verificar si hay otras encuestas en la misma ubicación (hasta 4 decimales)
    const sameLocationCount = allData.filter((r, i) => {
      if (i >= index) return false // Solo contar las anteriores
      const [rLat, rLong] = extractCoordinates(r)
      return Math.abs(rLat - lat) < 0.0001 && Math.abs(rLong - long) < 0.0001
    }).length
    
    if (sameLocationCount > 0) {
      // Aplicar offset pequeño en círculo alrededor del punto original
      const angle = (sameLocationCount * 60) * (Math.PI / 180) // 60 grados entre cada marcador
      const offsetDistance = 0.0002 // ~20 metros
      const latOffset = Math.sin(angle) * offsetDistance
      const longOffset = Math.cos(angle) * offsetDistance
      
      return [lat + latOffset, long + longOffset]
    }
    
    return [lat, long]
  }

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
          <button className="btn-back" onClick={handleBackToReports}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="dashboard-layout__title">Mapa de Encuestas</h1>
        </div>

        <div className="dashboard-layout__body">
          {/* Filtros de fecha */}
          <div className="filter-card">
            <h3 className="filter-card__title">
              Filtrar por Rango de Fechas
            </h3>
            <div className="filter-card__grid">
              <div className="filter-card__field">
                <DateInput
                  label="Fecha Inicio"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="filter-card__field">
                <DateInput
                  label="Fecha Fin"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            <div className="filter-card__actions">
              <button 
                className="btn btn--primary"
                onClick={handleApplyFilters}
                disabled={!startDate || !endDate || isLoading}
              >
                📊 Generar Reporte
              </button>
              <button 
                className="btn btn--secondary"
                onClick={handleClearFilters}
                disabled={isLoading || !useFilters}
              >
                🔄 Limpiar Filtros
              </button>
            </div>
            
            {useFilters && (
              <div className="filter-card__info">
                📅 Mostrando encuestas del {formatDateES(startDate)} al {formatDateES(endDate)}
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
              <div className="stat-card__label">No Exitosas</div>
            </div>
            <div 
              className={`stat-card ${filter === 'defensores' ? 'stat-card--active' : ''}`}
              onClick={() => setFilter('defensores')}
              style={{ cursor: 'pointer', backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}
            >
              <div className="stat-card__icon">
                <span style={{ fontSize: '1.5rem' }}>⭐</span>
              </div>
              <div className="stat-card__value">{stats.defensores}</div>
              <div className="stat-card__label">Defensores de la Patria</div>
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
            <div className="dashboard-map-container">
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
                
                {filteredRespondents.map((respondent, index) => {
                  const isSuccessful = respondent.willingToRespond === true
                  const icon = isSuccessful ? successfulIcon : unsuccessfulIcon
                  const adjustedPosition = getAdjustedPosition(respondent, index, filteredRespondents)
                  
                  // Get label from noResponseReason/rejectionReason
                  const getReasonLabel = () => {
                    const noResponse = respondent.noResponseReason as unknown as { label?: string }
                    const rejection = respondent.rejectionReason as unknown as { label?: string }
                    if (noResponse?.label) return noResponse.label
                    if (rejection?.label) return rejection.label
                    return 'No especificada'
                  }
                  const reasonLabel = getReasonLabel()
                  
                  // Tooltip text - show label for unsuccessful surveys
                  const tooltipText = isSuccessful 
                    ? respondent.fullName || 'Encuesta exitosa'
                    : reasonLabel
                  
                  return (
                    <Marker
                      key={respondent._id}
                      position={adjustedPosition}
                      icon={icon}
                    >
                      <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                        {tooltipText}
                      </Tooltip>
                      <Popup>
                        <div style={{ minWidth: '200px' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                            {isSuccessful 
                              ? (respondent.fullName || 'No proporcionado')
                              : reasonLabel
                            }
                          </h4>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                            <strong>Estado:</strong>{' '}
                            <span style={{ color: isSuccessful ? '#3b82f6' : '#ef4444' }}>
                              {isSuccessful ? 'Exitosa' : 'Rechazada'}
                            </span>
                          </div>
                          {!isSuccessful && (respondent.noResponseReason || respondent.rejectionReason) && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                              <strong>Razón:</strong> {reasonLabel}
                            </div>
                          )}
                          {respondent.neighborhood && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                              <strong>Barrio:</strong> {respondent.neighborhood}
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            <strong>Fecha:</strong> {formatDateES(respondent.createdAt)}
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
