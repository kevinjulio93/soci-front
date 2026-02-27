/**
 * ReportsMap - Mapa de ubicaciones de encuestas
 * Muestra todas las encuestas en un mapa con marcadores de colores según el estado
 * Optimizado para manejar miles de registros con renderizado condicional
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import * as L from 'leaflet'
import { Sidebar, DateInput } from '../components'
import { apiService } from '../services/api.service'
import { ROUTES, EXTERNAL_URLS, MESSAGES, MAP_CONFIG } from '../constants'
import { notificationService } from '../services/notification.service'
import { useAuth } from '../contexts/AuthContext'
import { 
  filterRespondentsWithLocation, 
  calculateMapCenter, 
  calculateSurveyStats,
  extractCoordinates,
  formatDateES 
} from '../utils'
import { getTodayISO } from '../utils/dateHelpers'
import { RespondentData } from '../models/ApiResponses'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import '../styles/Dashboard.scss'

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const getReasonLabel = (respondent: RespondentData) => {
  const noResponse = respondent.noResponseReason as unknown as { label?: string }
  const rejection = respondent.rejectionReason as unknown as { label?: string }
  if (noResponse?.label) return noResponse.label
  if (rejection?.label) return rejection.label
  return 'No especificada'
}

const buildPopupHtml = (respondent: RespondentData, isSuccessful: boolean, reasonLabel: string) => {
  const title = isSuccessful ? (respondent.fullName || 'No proporcionado') : reasonLabel
  const statusText = isSuccessful ? 'Exitosa' : 'Rechazada'
  const statusColor = isSuccessful ? '#3b82f6' : '#ef4444'
  const reasonLine = !isSuccessful && (respondent.noResponseReason || respondent.rejectionReason)
    ? `<div style="font-size:12px; color:#6b7280; margin-bottom:4px;"><strong>Razón:</strong> ${escapeHtml(reasonLabel)}</div>`
    : ''
  const neighborhoodLine = respondent.neighborhood
    ? `<div style="font-size:12px; color:#6b7280; margin-bottom:4px;"><strong>Barrio:</strong> ${escapeHtml(respondent.neighborhood)}</div>`
    : ''

  return `
    <div style="min-width:200px">
      <h4 style="margin:0 0 8px 0; font-size:14px; font-weight:600;">${escapeHtml(title)}</h4>
      <div style="font-size:12px; color:#6b7280; margin-bottom:4px;">
        <strong>Estado:</strong> <span style="color:${statusColor}">${statusText}</span>
      </div>
      ${reasonLine}
      ${neighborhoodLine}
      <div style="font-size:12px; color:#6b7280;">
        <strong>Fecha:</strong> ${escapeHtml(formatDateES(respondent.createdAt))}
      </div>
    </div>
  `.trim()
}

function ClusteredMarkers({
  respondents,
  getAdjustedPosition,
  successfulIcon,
  unsuccessfulIcon,
}: {
  respondents: RespondentData[]
  getAdjustedPosition: (respondent: RespondentData) => [number, number]
  successfulIcon: L.Icon
  unsuccessfulIcon: L.Icon
}) {
  const map = useMap()
  const clusterGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        removeOutsideVisibleBounds: true,
        showCoverageOnHover: false,
        maxClusterRadius: 50,
      })
      map.addLayer(clusterGroupRef.current)
    }

    const clusterGroup = clusterGroupRef.current
    clusterGroup.clearLayers()

    respondents.forEach((respondent) => {
      const isSuccessful = respondent.willingToRespond === true
      const icon = isSuccessful ? successfulIcon : unsuccessfulIcon
      const adjustedPosition = getAdjustedPosition(respondent)
      const reasonLabel = getReasonLabel(respondent)
      const tooltipText = isSuccessful ? (respondent.fullName || 'Encuesta exitosa') : reasonLabel

      const marker = L.marker(adjustedPosition, { icon })
      marker.bindTooltip(tooltipText, { direction: 'top', offset: [0, -10], opacity: 0.9 })
      marker.bindPopup(buildPopupHtml(respondent, isSuccessful, reasonLabel))
      clusterGroup.addLayer(marker)
    })

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current)
        clusterGroupRef.current = null
      }
    }
  }, [map, respondents, getAdjustedPosition, successfulIcon, unsuccessfulIcon])

  return null
}

// Componente para renderizar solo marcadores visibles en el viewport
function VisibleMarkers({ 
  respondents, 
  getAdjustedPosition, 
  successfulIcon, 
  unsuccessfulIcon 
}: { 
  respondents: RespondentData[]
  getAdjustedPosition: (respondent: RespondentData) => [number, number]
  successfulIcon: L.Icon
  unsuccessfulIcon: L.Icon
}) {
  const map = useMap()
  const [visibleMarkers, setVisibleMarkers] = useState<RespondentData[]>([])

  // Función para calcular marcadores visibles
  const updateVisibleMarkers = useCallback(() => {
    const bounds = map.getBounds()
    
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
    
    // Limitar siempre el numero de marcadores visibles para evitar consumo de memoria en mobile
    setVisibleMarkers(visible.slice(0, 300))
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
      <ClusteredMarkers
        respondents={visibleMarkers}
        getAdjustedPosition={getAdjustedPosition}
        successfulIcon={successfulIcon}
        unsuccessfulIcon={unsuccessfulIcon}
      />
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
        {respondents.length > visibleMarkers.length && (
          <> - Haz zoom o mueve el mapa para ver otros</>
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
    
    const bounds = new L.LatLngBounds(
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
const successfulIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: EXTERNAL_URLS.LEAFLET_MARKER_SHADOW,
  iconSize: MAP_CONFIG.MARKER_SIZE,
  iconAnchor: MAP_CONFIG.MARKER_ANCHOR,
  popupAnchor: MAP_CONFIG.POPUP_ANCHOR,
  shadowSize: MAP_CONFIG.SHADOW_SIZE
})

const unsuccessfulIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: EXTERNAL_URLS.LEAFLET_MARKER_SHADOW,
  iconSize: MAP_CONFIG.MARKER_SIZE,
  iconAnchor: MAP_CONFIG.MARKER_ANCHOR,
  popupAnchor: MAP_CONFIG.POPUP_ANCHOR,
  shadowSize: MAP_CONFIG.SHADOW_SIZE
})

type FilterType = 'all' | 'successful' | 'unsuccessful' | 'defensores'

// interface SocializerReport {
//   dailyStats: Array<{
//     date: string
//     totalSurveys: number
//     surveys: RespondentData[]
//   }>
//   allSurveys: RespondentData[]
// }

export default function ReportsMap() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [allRespondents, setAllRespondents] = useState<RespondentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [startDate, setStartDate] = useState(getTodayISO())
  const [endDate, setEndDate] = useState(getTodayISO())
  const [useFilters, setUseFilters] = useState(false)
  const [showRejectionBreakdown, setShowRejectionBreakdown] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    unsuccessful: 0,
    defensores: 0,
  })

  // Verificar si el usuario puede ver datos de rechazo (solo admin, no supervisores)
  const canViewUnsuccessful = useMemo(() => {
    const userRole = user?.role?.role?.toLowerCase() || ''
    return userRole !== 'supervisor'
  }, [user?.role?.role])

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

  // Handlers para otras cards que ocultan los motivos de rechazo
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

  // Cargar encuestas del día (una sola llamada)
  const loadAllRespondents = async () => {
    try {
      setIsLoading(true)
      const today = getTodayISO()
      const response = await apiService.getReportsBySocializerAndDate(today, today)
      const report = response.data?.report || []
      
      const allSurveys: RespondentData[] = report.flatMap((socializer: { allSurveys?: unknown[] }) =>
        Array.isArray(socializer.allSurveys)
          ? socializer.allSurveys.map((s) => new RespondentData(s))
          : []
      )
      
      const respondentsWithLocation = filterRespondentsWithLocation(allSurveys)
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

    if (endDate < startDate) {
      notificationService.warning('La fecha final no puede ser menor que la fecha inicial')
      return
    }

    try {
      setIsLoading(true)
      const response = await apiService.getReportsBySocializerAndDate(startDate, endDate)

      // La respuesta tiene estructura:
      // {
      //   dateRange: { startDate, endDate },
      //   totalSocializers: number,
      //   resumen: { totalEncuestas, totalExitosas, totalNoExitosas, ... },
      //   report: [{ socializerName, totalSurveys, allSurveys: RespondentData[] }, ...]
      // }
      const report = response.data?.report || []

      // Extraer todas las encuestas de todos los socializadores
      const allSurveys: RespondentData[] = report.flatMap((socializer: { allSurveys?: unknown[] }) =>
        Array.isArray(socializer.allSurveys)
          ? socializer.allSurveys.map((s) => new RespondentData(s))
          : []
      )

      const respondentsWithLocation = filterRespondentsWithLocation(allSurveys)
      
      if (respondentsWithLocation.length === 0 && allSurveys.length > 0) {
        console.warn('⚠️ Todas las encuestas fueron filtradas. Verificar estructura de datos.')
      }
      
      setAllRespondents(respondentsWithLocation)
      const newStats = calculateSurveyStats(respondentsWithLocation)
      const defensoresCount = respondentsWithLocation.filter(r => (r as any).isPatriaDefender === true).length
      setStats({ ...newStats, defensores: defensoresCount })
      setUseFilters(true)
      
      notificationService.success('Encuestas filtradas correctamente')
    } catch (error) {
      console.error('❌ Error al filtrar encuestas:', error)
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
  
  // Función para obtener posición - sin offsets, el clustering se encarga de la distribución
  const getAdjustedPosition = useCallback((respondent: RespondentData): [number, number] => {
    return extractCoordinates(respondent)
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
                  min={startDate}
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
                <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Actualizar Mapa
              </button>
              <button 
                className="btn btn--primary"
                onClick={handleClearFilters}
                disabled={isLoading || !useFilters}
              >
                <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                Limpiar Filtros
              </button>
            </div>
            
            {useFilters && (
              <div className="filter-card__info">
                <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Mostrando encuestas del {formatDateES(startDate)} al {formatDateES(endDate)}
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
            {canViewUnsuccessful && (
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
            )}
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

          {/* Motivos de rechazo */}
          {showRejectionBreakdown && stats.unsuccessful > 0 && (
            <div className="rejection-breakdown">
              <h3 className="rejection-breakdown__title">
                <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Motivos de Rechazo
              </h3>
              <div className="rejection-breakdown__grid">
                {rejectionStats.map((stat, index) => (
                  <div key={index} className="rejection-breakdown__item">
                    <div className="rejection-breakdown__count">
                      {stat.count}
                    </div>
                    <div className="rejection-breakdown__label">
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
