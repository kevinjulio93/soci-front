/**
 * ReportsMap - Mapa de ubicaciones de encuestas
 * Muestra todas las encuestas en un mapa con marcadores de colores según el estado
 * Optimizado para manejar miles de registros con renderizado condicional
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet'
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

// Componente optimizado de marcador individual
const OptimizedMarker = memo(({ 
  respondent, 
  icon, 
  position 
}: { 
  respondent: RespondentData
  icon: Icon
  position: [number, number]
}) => {
  const isSuccessful = respondent.willingToRespond === true
  
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
    <Marker position={position} icon={icon}>
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
})

OptimizedMarker.displayName = 'OptimizedMarker'

// Componente para renderizar solo marcadores visibles en el viewport
function VisibleMarkers({ 
  respondents, 
  getAdjustedPosition, 
  successfulIcon, 
  unsuccessfulIcon 
}: { 
  respondents: RespondentData[]
  getAdjustedPosition: (respondent: RespondentData, index: number, allData: RespondentData[]) => [number, number]
  successfulIcon: Icon
  unsuccessfulIcon: Icon
}) {
  const map = useMap()
  const [visibleMarkers, setVisibleMarkers] = useState<RespondentData[]>([])
  const [zoom, setZoom] = useState(map.getZoom())

  // Función para calcular marcadores visibles
  const updateVisibleMarkers = useCallback(() => {
    const bounds = map.getBounds()
    const currentZoom = map.getZoom()
    setZoom(currentZoom)
    
    // Filtrar solo marcadores dentro del viewport con un margen pequeño
    const padding = 0.05 // 5% de margen para precargar
    const latPadding = (bounds.getNorth() - bounds.getSouth()) * padding
    const lngPadding = (bounds.getEast() - bounds.getWest()) * padding
    
    const visible = respondents.filter((r) => {
      const [lat, lng] = extractCoordinates(r)
      return lat >= bounds.getSouth() - latPadding &&
             lat <= bounds.getNorth() + latPadding &&
             lng >= bounds.getWest() - lngPadding &&
             lng <= bounds.getEast() + lngPadding
    })
    
    // Si el zoom es alto (>= 14), renderizar todos los visibles
    // Si el zoom es bajo, limitar a 500 para performance
    if (currentZoom >= 14) {
      setVisibleMarkers(visible)
    } else {
      setVisibleMarkers(visible.slice(0, 500))
    }
  }, [respondents, map])

  // Escuchar eventos del mapa
  useMapEvents({
    moveend: updateVisibleMarkers,
    zoomend: updateVisibleMarkers,
  })

  // Actualizar en el primer render y cuando cambien los respondents
  useEffect(() => {
    updateVisibleMarkers()
  }, [respondents, updateVisibleMarkers])

  return (
    <>
      {visibleMarkers.map((respondent, index) => {
        const isSuccessful = respondent.willingToRespond === true
        const icon = isSuccessful ? successfulIcon : unsuccessfulIcon
        const adjustedPosition = getAdjustedPosition(respondent, index, visibleMarkers)
        
        return (
          <OptimizedMarker
            key={respondent._id}
            respondent={respondent}
            icon={icon}
            position={adjustedPosition}
          />
        )
      })}
      {/* Indicador de marcadores visibles */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        Mostrando {visibleMarkers.length} de {respondents.length} marcadores
        {respondents.length > visibleMarkers.length && zoom < 14 && (
          <> - Haz zoom para ver todos</>
        )}
      </div>
    </>
  )
}

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
    
    // Ajustar bounds con zoom máximo para ver de cerca
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 })
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
  const [showRejectionBreakdown, setShowRejectionBreakdown] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    unsuccessful: 0,
    defensores: 0,
  })

  // Calcular estadísticas de motivos de rechazo
  const rejectionStats = useMemo(() => {
    const unsuccessful = allRespondents.filter(r => r.willingToRespond === false)
    const stats = new Map<string, { label: string; count: number }>()
    
    unsuccessful.forEach(r => {
      const reason = r.noResponseReason || r.rejectionReason
      if (reason) {
        const reasonObj = reason as unknown as { value?: string; label?: string }
        const key = reasonObj.value || 'other'
        const label = reasonObj.label || 'Otro motivo'
        
        if (stats.has(key)) {
          stats.get(key)!.count++
        } else {
          stats.set(key, { label, count: 1 })
        }
      } else {
        if (stats.has('no_specified')) {
          stats.get('no_specified')!.count++
        } else {
          stats.set('no_specified', { label: 'No especificado', count: 1 })
        }
      }
    })
    
    return Array.from(stats.values()).sort((a, b) => b.count - a.count)
  }, [allRespondents])

  // Handler para el click en la card de no exitosas
  const handleUnsuccessfulClick = () => {
    setFilter('unsuccessful')
    setShowRejectionBreakdown(!showRejectionBreakdown)
  }

  // Handlers para otras cards que ocultan el desglose
  const handleAllClick = () => {
    setFilter('all')
    setShowRejectionBreakdown(false)
  }

  const handleSuccessfulClick = () => {
    setFilter('successful')
    setShowRejectionBreakdown(false)
  }

  const handleDefensoresClick = () => {
    setFilter('defensores')
    setShowRejectionBreakdown(false)
  }

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

      // La nueva respuesta del backend trae directamente el array data con todas las encuestas
      const allSurveys: RespondentData[] = response.data || []

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

  // Memoizar el filtrado para evitar recálculos innecesarios
  const filteredRespondents = useMemo(() => {
    return allRespondents.filter(r => {
      if (filter === 'all') return true
      if (filter === 'successful') return r.willingToRespond === true
      if (filter === 'unsuccessful') return r.willingToRespond === false
      if (filter === 'defensores') return (r as any).isPatriaDefender === true
      return true
    })
  }, [allRespondents, filter])

  const mapCenter = useMemo(() => calculateMapCenter(allRespondents), [allRespondents])
  
  // Memoizar la función de ajuste de posición
  const getAdjustedPosition = useCallback((respondent: RespondentData, index: number, allData: RespondentData[]): [number, number] => {
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
  }, [])

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
              onClick={handleAllClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-card__value">{stats.total}</div>
              <div className="stat-card__label">Total de Intervenciones</div>
            </div>
            <div 
              className={`stat-card stat-card--success ${filter === 'successful' ? 'stat-card--active' : ''}`}
              onClick={handleSuccessfulClick}
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
              onClick={handleUnsuccessfulClick}
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
              onClick={handleDefensoresClick}
              style={{ cursor: 'pointer', backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}
            >
              <div className="stat-card__icon">
                <span style={{ fontSize: '1.5rem' }}>⭐</span>
              </div>
              <div className="stat-card__value">{stats.defensores}</div>
              <div className="stat-card__label">Defensores de la Patria</div>
            </div>
          </div>

          {/* Desglose de motivos de rechazo */}
          {showRejectionBreakdown && stats.unsuccessful > 0 && (
            <div style={{
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid #fecaca'
            }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#991b1b'
              }}>
                📊 Desglose de Motivos de Rechazo
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px'
              }}>
                {rejectionStats.map((stat, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      padding: '12px',
                      border: '1px solid #fecaca',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#dc2626',
                      marginBottom: '4px'
                    }}>
                      {stat.count}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      lineHeight: '1.3'
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
              {rejectionStats.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px',
                  padding: '20px'
                }}>
                  No hay datos de motivos de rechazo disponibles
                </div>
              )}
            </div>
          )}

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
                zoom={18}
                maxZoom={18}
                style={{ height: '100%', width: '100%' }}
                preferCanvas={true}
              >
                <TileLayer
                  attribution={EXTERNAL_URLS.LEAFLET_ATTRIBUTION}
                  url={EXTERNAL_URLS.LEAFLET_TILE_URL}
                  maxZoom={18}
                />
                
                <MapBounds respondents={filteredRespondents} />
                
                {/* Renderizado optimizado de marcadores solo en viewport */}
                <VisibleMarkers
                  respondents={filteredRespondents}
                  getAdjustedPosition={getAdjustedPosition}
                  successfulIcon={successfulIcon}
                  unsuccessfulIcon={unsuccessfulIcon}
                />
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
