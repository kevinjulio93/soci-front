/**
 * ReportsMap - Mapa de ubicaciones de encuestas
 * Usa Leaflet (gratuito) + Supercluster (clustering ultrarrápido)
 * Optimizado para manejar miles de registros
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import * as L from 'leaflet'
import Supercluster from 'supercluster'
import { Sidebar, DateInput } from '../components'
import { apiService } from '../services/api.service'
import { ROUTES, MESSAGES } from '../constants'
import { notificationService } from '../services/notification.service'
import { useAuth } from '../contexts/AuthContext'
import {
  filterRespondentsWithLocation,
  calculateMapCenter,
  calculateSurveyStats,
  formatDateES
} from '../utils'
import { getTodayISO } from '../utils/dateHelpers'
import { RespondentData } from '../models/ApiResponses'
import 'leaflet/dist/leaflet.css'
import '../styles/Dashboard.scss'
import '../styles/MetricsCard.scss'

// Tile provider gratuito de alta calidad (CartoDB Voyager - estilo similar a Google Maps)
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'

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
      ${respondent.isVerified ? '<div style="font-size:12px; color:#0d9488; margin-bottom:4px;"><strong>✅ Verificada</strong></div>' : ''}
      ${respondent.isLinkedHouse ? '<div style="font-size:12px; color:#7c3aed; margin-bottom:4px;"><strong>🏠 Vinculación Extra</strong></div>' : ''}
      ${reasonLine}
      ${neighborhoodLine}
    </div>
  `.trim()
}

// Crear iconos de cluster como DivIcon de Leaflet
function createClusterIcon(count: number): L.DivIcon {
  let size = 36
  let bgColor = 'rgba(59, 130, 246, 0.85)'

  if (count > 10) { size = 44; bgColor = 'rgba(234, 179, 8, 0.85)'; }
  if (count > 50) { size = 52; bgColor = 'rgba(239, 68, 68, 0.85)'; }
  if (count > 200) { size = 60; bgColor = 'rgba(139, 92, 246, 0.85)'; }

  return L.divIcon({
    html: `<div style="
      width:${size}px; height:${size}px; border-radius:50%;
      background:${bgColor}; color:#fff; display:flex;
      align-items:center; justify-content:center;
      font-weight:bold; font-size:13px;
      border:3px solid rgba(255,255,255,0.9);
      box-shadow:0 3px 8px rgba(0,0,0,0.3);
      cursor:pointer;
    ">${count}</div>`,
    className: 'supercluster-marker',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  })
}

// Crear icono individual de pin
function createPinIcon(isSuccessful: boolean): L.DivIcon {
  const color = isSuccessful ? '#3b82f6' : '#ef4444'
  const glyph = isSuccessful ? '✓' : '✗'

  return L.divIcon({
    html: `<div style="
      width:28px; height:28px; border-radius:50% 50% 50% 0;
      background:${color}; transform:rotate(-45deg);
      border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer;
    "><span style="transform:rotate(45deg); color:#fff; font-size:14px; font-weight:bold;">${glyph}</span></div>`,
    className: 'supercluster-pin',
    iconSize: L.point(28, 40),
    iconAnchor: L.point(14, 40),
    popupAnchor: [0, -40],
  })
}

// Componente que renderiza clusters y marcadores con Supercluster
function SuperclusterLayer({
  respondents,
}: {
  respondents: RespondentData[]
}) {
  const map = useMap()
  const [clusters, setClusters] = useState<any[]>([])
  const markersLayerRef = useRef<L.LayerGroup>(L.layerGroup())

  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 60,
      maxZoom: 18,
    })

    const points = respondents.map(r => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        respondentId: r._id,
        isSuccessful: r.surveyStatus === 'successful',
        fullName: r.fullName,
        isVerified: r.isVerified,
        isLinkedHouse: r.isLinkedHouse,
        noResponseReason: r.noResponseReason,
        rejectionReason: r.rejectionReason,
        createdAt: r.createdAt,
        neighborhood: r.neighborhood,
        willingToRespond: r.willingToRespond,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [
          r.location?.coordinates[0] || 0,
          r.location?.coordinates[1] || 0
        ]
      }
    }))

    sc.load(points)
    return sc
  }, [respondents])

  const updateClusters = useCallback(() => {
    const mapBounds = map.getBounds()
    const mapZoom = Math.round(map.getZoom())

    const bounds: [number, number, number, number] = [
      mapBounds.getWest(),
      mapBounds.getSouth(),
      mapBounds.getEast(),
      mapBounds.getNorth()
    ]

    const newClusters = supercluster.getClusters(bounds, mapZoom)
    setClusters(newClusters)
  }, [map, supercluster])

  // Escuchar cambios de zoom y movimiento
  useMapEvents({
    moveend: updateClusters,
    zoomend: updateClusters,
  })

  // Primera carga
  useEffect(() => {
    updateClusters()
  }, [updateClusters])

  // Renderizar marcadores en el mapa
  useEffect(() => {
    const layer = markersLayerRef.current
    layer.clearLayers()

    clusters.forEach(cluster => {
      const [lng, lat] = cluster.geometry.coordinates
      const isCluster = cluster.properties.cluster

      if (isCluster) {
        const count = cluster.properties.point_count
        const icon = createClusterIcon(count)
        const marker = L.marker([lat, lng], { icon })

        marker.on('click', () => {
          const expansionZoom = supercluster.getClusterExpansionZoom(cluster.id)
          map.flyTo([lat, lng], expansionZoom, { duration: 0.5 })
        })

        layer.addLayer(marker)
      } else {
        const isSuccessful = cluster.properties.isSuccessful === true
        const icon = createPinIcon(isSuccessful)
        const marker = L.marker([lat, lng], { icon })

        // Crear respondent temporal para popup
        const r = respondents.find(resp => resp._id === cluster.properties.respondentId)
        if (r) {
          const reasonLabel = getReasonLabel(r)
          const tooltipText = isSuccessful ? (r.fullName || 'Encuesta exitosa') : reasonLabel
          marker.bindTooltip(tooltipText, { direction: 'top', offset: [0, -40], opacity: 0.9 })
          marker.bindPopup(buildPopupHtml(r, isSuccessful, reasonLabel), { maxWidth: 300 })
        }

        layer.addLayer(marker)
      }
    })

    if (!map.hasLayer(layer)) {
      map.addLayer(layer)
    }

    return () => {
      layer.clearLayers()
    }
  }, [clusters, map, supercluster, respondents])

  // Fit bounds en primera carga
  useEffect(() => {
    if (respondents.length === 0) return

    const bounds = L.latLngBounds(
      respondents.map(r => [
        r.location?.coordinates[1] || 0,
        r.location?.coordinates[0] || 0,
      ] as [number, number])
    )

    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
  }, [respondents.length]) // Solo en primera carga

  return null
}

type FilterType = 'all' | 'successful' | 'unsuccessful' | 'defensores' | 'isVerified' | 'isLinkedHouse' | 'isOffline'

export default function ReportsMap() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [allSurveys, setAllSurveys] = useState<RespondentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [startDate, setStartDate] = useState(getTodayISO())
  const [endDate, setEndDate] = useState(getTodayISO())
  const [useFilters, setUseFilters] = useState(false)
  const [fetchedDateRange, setFetchedDateRange] = useState({ start: '', end: '' })
  const [showRejectionBreakdown, setShowRejectionBreakdown] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    unsuccessful: 0,
    defensores: 0,
    isVerified: 0,
    isLinkedHouse: 0,
    linkedHomes: 0,
    isOffline: 0,
  })

  // Verificar si el usuario puede ver datos de rechazo (solo admin, no supervisores)
  const canViewUnsuccessful = useMemo(() => {
    const userRole = user?.role?.role?.toLowerCase() || ''
    return userRole !== 'supervisor'
  }, [user?.role?.role])

  // Encuestas con ubicación para el mapa
  const respondentsWithLocation = useMemo(() =>
    filterRespondentsWithLocation(allSurveys),
    [allSurveys])

  // Calcular estadísticas de motivos de rechazo usando TODAS las encuestas
  const rejectionStats = useMemo(() => {
    const unsuccessful = allSurveys.filter(r => r.willingToRespond === false)
    const localStats: { [key: string]: { label: string; count: number } } = {}

    unsuccessful.forEach(r => {
      const reason = r.noResponseReason || r.rejectionReason
      if (reason) {
        const reasonObj = reason as unknown as { value?: string; label?: string }
        const key = reasonObj.value || 'other'
        const label = reasonObj.label || 'Otro motivo'

        if (localStats[key]) {
          localStats[key].count++
        } else {
          localStats[key] = { label, count: 1 }
        }
      } else {
        if (localStats['no_specified']) {
          localStats['no_specified'].count++
        } else {
          localStats['no_specified'] = { label: 'No especificado', count: 1 }
        }
      }
    })

    return Object.values(localStats).sort((a: any, b: any) => b.count - a.count)
  }, [allSurveys])

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

  const handleVerifiedClick = () => {
    setFilter('isVerified')
    setShowRejectionBreakdown(false)
  }

  const handleLinkedHouseClick = () => {
    setFilter('isLinkedHouse')
    setShowRejectionBreakdown(false)
  }

  const handleOfflineClick = () => {
    setFilter('isOffline')
    setShowRejectionBreakdown(false)
  }

  // Cargar encuestas del día (una sola llamada)
  const loadAllRespondents = async (overrideStartDate?: string, overrideEndDate?: string) => {
    try {
      setIsLoading(true)
      const today = getTodayISO()
      const sDate = overrideStartDate || today
      const eDate = overrideEndDate || today
      const response = await apiService.getReportsBySocializerAndDate(sDate, eDate)
      const surveysData = response.data?.surveys || []
      const allSurveys: RespondentData[] = surveysData.filter((s: any) => s != null).map((s: any) => new RespondentData(s))


      setAllSurveys(allSurveys)

      const resumen = response.data?.resumen || response.resumen

      // Intenta usar los totales del backend, si no, los calcula iterando
      const newStats = calculateSurveyStats(allSurveys)
      const defensoresCount = resumen?.totalPatriaDefender ?? resumen?.totalIsPatriaDefender ?? allSurveys.filter(r => (r as any).isPatriaDefender === true).length
      const verifiedCount = resumen?.totalVerified ?? resumen?.totalIsVerified ?? allSurveys.filter(r => r.isVerified === true).length
      const linkedHouseCount = resumen?.totalLinkedHouse ?? resumen?.totalIsLinkedHouse ?? allSurveys.filter(r => r.isLinkedHouse === true).length
      const linkedHomesCount = resumen?.linkedHomes ?? allSurveys.filter(r => (r as any).linkedHomes === true).length
      const offlineCount = resumen?.totalIsOffline ?? allSurveys.filter(r => (r as any).isOffline === true).length

      setStats({
        ...newStats,
        total: resumen?.totalEncuestas ?? newStats.total,
        successful: resumen?.totalExitosa ?? resumen?.totalExitosas ?? newStats.successful,
        unsuccessful: resumen?.totalNoExitosa ?? resumen?.totalNoExitosas ?? newStats.unsuccessful,
        defensores: defensoresCount,
        isVerified: verifiedCount,
        isLinkedHouse: linkedHouseCount,
        linkedHomes: linkedHomesCount,
        isOffline: offlineCount,
      })
      setFetchedDateRange({ start: sDate, end: eDate })
    } catch (error) {
      notificationService.handleApiError(error, MESSAGES.RESPONDENT_LOAD_ERROR)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar encuestas filtradas por fecha
  const loadFilteredRespondents = async (overrideStartDate?: string, overrideEndDate?: string) => {
    const sDate = overrideStartDate || startDate
    const eDate = overrideEndDate || endDate

    if (!sDate || !eDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }

    if (eDate < sDate) {
      notificationService.warning('La fecha final no puede ser menor que la fecha inicial')
      return
    }

    try {
      setIsLoading(true)
      const response = await apiService.getReportsBySocializerAndDate(sDate, eDate)
      const surveysData = response.data?.surveys || []
      const allSurveys: RespondentData[] = surveysData.filter((s: any) => s != null).map((s: any) => new RespondentData(s))

      if (filterRespondentsWithLocation(allSurveys).length === 0 && allSurveys.length > 0) {
        console.warn('⚠️ Todas las encuestas fueron filtradas. Verificar estructura de datos.')
      }

      setAllSurveys(allSurveys)

      const resumen = response.data?.resumen || response.resumen

      // Calcular estadísticas usando TODAS las encuestas (con y sin ubicación)
      const newStats = calculateSurveyStats(allSurveys)
      const defensoresCount = resumen?.totalPatriaDefender ?? resumen?.totalIsPatriaDefender ?? allSurveys.filter(r => (r as any).isPatriaDefender === true).length
      const verifiedCount = resumen?.totalVerified ?? resumen?.totalIsVerified ?? allSurveys.filter(r => r.isVerified === true).length
      const linkedHouseCount = resumen?.totalLinkedHouse ?? resumen?.totalIsLinkedHouse ?? allSurveys.filter(r => r.isLinkedHouse === true).length
      const linkedHomesCount = resumen?.linkedHomes ?? allSurveys.filter(r => (r as any).linkedHomes === true).length
      const offlineCount = resumen?.totalIsOffline ?? allSurveys.filter(r => (r as any).isOffline === true).length

      setStats({
        ...newStats,
        total: resumen?.totalEncuestas ?? newStats.total,
        successful: resumen?.totalExitosa ?? resumen?.totalExitosas ?? newStats.successful,
        unsuccessful: resumen?.totalNoExitosa ?? resumen?.totalNoExitosas ?? newStats.unsuccessful,
        defensores: defensoresCount,
        isVerified: verifiedCount,
        isLinkedHouse: linkedHouseCount,
        linkedHomes: linkedHomesCount,
        isOffline: offlineCount,
      })
      setUseFilters(true)
      setFetchedDateRange({ start: startDate, end: endDate })

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
    const today = getTodayISO()
    setStartDate(today)
    setEndDate(today)
    setUseFilters(false)
    loadAllRespondents(today, today)
  }

  const handleStartDateChange = (val: string) => {
    setStartDate(val)
    if (val && endDate && val > endDate) {
      setEndDate(val)
    }
  }

  const handleEndDateChange = (val: string) => {
    setEndDate(val)
    if (val && startDate && val < startDate) {
      setStartDate(val)
    }
  }

  const handleApplyFilters = () => {
    loadFilteredRespondents()
  }

  // Memoizar el filtrado para el mapa
  const filteredRespondents = useMemo(() => {
    return respondentsWithLocation.filter(r => {
      if (filter === 'all') return true
      if (filter === 'successful') return r.willingToRespond === true
      if (filter === 'unsuccessful') return r.willingToRespond === false
      if (filter === 'defensores') return (r as any).isPatriaDefender === true
      if (filter === 'isVerified') return r.isVerified === true
      if (filter === 'isLinkedHouse') return r.isLinkedHouse === true
      if (filter === 'isOffline') return (r as any).isOffline === true
      return true
    })
  }, [respondentsWithLocation, filter])

  const mapCenter = useMemo(() => calculateMapCenter(respondentsWithLocation), [respondentsWithLocation])

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
                  max={endDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="filter-card__field">
                <DateInput
                  label="Fecha Fin"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
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
                <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Actualizar Mapa
              </button>
              <button
                className="btn btn--primary"
                onClick={handleClearFilters}
                disabled={isLoading || !useFilters}
              >
                <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" /></svg>
                Limpiar Filtros
              </button>
            </div>

            {fetchedDateRange.start && (
              <div className="filter-card__info">
                <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Mostrando métricas del {formatDateES(fetchedDateRange.start)} al {formatDateES(fetchedDateRange.end)}
              </div>
            )}
          </div>

          {/* Estadísticas con filtros clickeables */}
          <div className="reports-stats">
            {isLoading && (
              <div className="metrics-loading-overlay">
                <div className="spinner"></div>
              </div>
            )}
            <div
              className={`stat-card stat-card--primary ${filter === 'all' ? 'stat-card--active' : ''}`}
              onClick={handleAllClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-card__icon">
                <span style={{ fontSize: '1.2rem' }}>📊</span>
              </div>
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
              className={`stat-card stat-card--warning ${filter === 'defensores' ? 'stat-card--active' : ''}`}
              onClick={handleDefensoresClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-card__icon">
                <span style={{ fontSize: '1.5rem' }}>⭐</span>
              </div>
              <div className="stat-card__value">{stats.defensores}</div>
              <div className="stat-card__label">Defensores de la Patria</div>
            </div>

            <div
              className={`stat-card stat-card--info ${filter === 'isVerified' ? 'stat-card--active' : ''}`}
              onClick={handleVerifiedClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-card__icon">
                <span style={{ fontSize: '1.5rem' }}>✅</span>
              </div>
              <div className="stat-card__value">{stats.isVerified}</div>
              <div className="stat-card__label">Verificadas</div>
            </div>

            <div
              className={`stat-card stat-card--purple ${filter === 'isLinkedHouse' ? 'stat-card--active' : ''}`}
              onClick={handleLinkedHouseClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-card__icon">
                <span style={{ fontSize: '1.5rem' }}>➕</span>
              </div>
              <div className="stat-card__value">{stats.isLinkedHouse}</div>
              <div className="stat-card__label">VINCULACIONES EXTRAS</div>
            </div>

            <div
              className={`stat-card stat-card--success`}
              style={{ cursor: 'default' }}
            >
              <div className="stat-card__icon">
                <span style={{ fontSize: '1.5rem' }}>🏠</span>
              </div>
              <div className="stat-card__value">{stats.linkedHomes}</div>
              <div className="stat-card__label">HOGARES VINCULADOS</div>
            </div>

            <div
              className={`stat-card stat-card--darkblue ${filter === 'isOffline' ? 'stat-card--active' : ''}`}
              onClick={handleOfflineClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-card__icon">
                <span style={{ fontSize: '1.5rem' }}>📡</span>
              </div>
              <div className="stat-card__value">{stats.isOffline}</div>
              <div className="stat-card__label">Registro Sin Conexión</div>
            </div>
          </div>

          {/* Motivos de rechazo */}
          {showRejectionBreakdown && stats.unsuccessful > 0 && (
            <div className="rejection-breakdown">
              <h3 className="rejection-breakdown__title">
                <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                Motivos de Rechazo
              </h3>
              <div className="rejection-breakdown__grid">
                {rejectionStats.map((stat: any, index: number) => (
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
          <div className={`dashboard-map-container ${isLoading ? 'dashboard-map-container--loading' : ''}`} style={{ position: 'relative' }}>
            {isLoading && (
              <div className="metrics-loading-overlay" style={{ background: 'transparent' }}>
                <div className="spinner"></div>
              </div>
            )}

            {/* Mensajes de aviso si no hay datos para mostrar en el mapa */}
            {!isLoading && allSurveys.length === 0 && (
              <div className="map-empty-overlay">
                <p>No hay encuestas registradas para este periodo</p>
              </div>
            )}
            {!isLoading && allSurveys.length > 0 && respondentsWithLocation.length === 0 && (
              <div className="map-empty-overlay">
                <p>Las encuestas encontradas no tienen ubicación registrada</p>
              </div>
            )}

            <MapContainer
              center={mapCenter}
              zoom={5}
              maxZoom={18}
              style={{ height: '100%', width: '100%' }}
              preferCanvas={true}
            >
              <TileLayer
                attribution={TILE_ATTRIBUTION}
                url={TILE_URL}
                maxZoom={20}
              />
              <SuperclusterLayer respondents={filteredRespondents} />
            </MapContainer>

            {/* Leyenda del mapa - visible solo en desktop como overlay */}
            <div className="map-legend map-legend--overlay">
              <div className="map-legend__title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Leyenda
              </div>
              <div className="map-legend__section">
                <span className="map-legend__section-label">Agrupaciones</span>
                <div className="map-legend__item">
                  <span className="map-legend__dot" style={{ background: 'rgba(59, 130, 246, 0.85)' }}></span>
                  <span>1 – 10</span>
                </div>
                <div className="map-legend__item">
                  <span className="map-legend__dot" style={{ background: 'rgba(234, 179, 8, 0.85)' }}></span>
                  <span>11 – 50</span>
                </div>
                <div className="map-legend__item">
                  <span className="map-legend__dot" style={{ background: 'rgba(239, 68, 68, 0.85)' }}></span>
                  <span>51 – 200</span>
                </div>
                <div className="map-legend__item">
                  <span className="map-legend__dot" style={{ background: 'rgba(139, 92, 246, 0.85)' }}></span>
                  <span>200+</span>
                </div>
              </div>
              <div className="map-legend__section">
                <span className="map-legend__section-label">Encuestas</span>
                <div className="map-legend__item">
                  <span className="map-legend__pin" style={{ background: '#3b82f6' }}>✓</span>
                  <span>Exitosa</span>
                </div>
                <div className="map-legend__item">
                  <span className="map-legend__pin" style={{ background: '#ef4444' }}>✗</span>
                  <span>No exitosa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leyenda del mapa - visible solo en mobile, debajo del mapa */}
          <div className="map-legend map-legend--mobile">
            <div className="map-legend__title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Leyenda del Mapa
            </div>
            <div className="map-legend__row">
              <div className="map-legend__section">
                <span className="map-legend__section-label">Agrupaciones</span>
                <div className="map-legend__item">
                  <span className="map-legend__dot" style={{ background: 'rgba(59, 130, 246, 0.85)' }}></span>
                  <span>1 – 10</span>
                </div>
                <div className="map-legend__item">
                  <span className="map-legend__dot" style={{ background: 'rgba(234, 179, 8, 0.85)' }}></span>
                  <span>11 – 50</span>
                </div>
                <div className="map-legend__item">
                  <span className="map-legend__dot" style={{ background: 'rgba(239, 68, 68, 0.85)' }}></span>
                  <span>51 – 200</span>
                </div>
                <div className="map-legend__item">
                  <span className="map-legend__dot" style={{ background: 'rgba(139, 92, 246, 0.85)' }}></span>
                  <span>200+</span>
                </div>
              </div>
              <div className="map-legend__section">
                <span className="map-legend__section-label">Encuestas</span>
                <div className="map-legend__item">
                  <span className="map-legend__pin" style={{ background: '#3b82f6' }}>✓</span>
                  <span>Exitosa</span>
                </div>
                <div className="map-legend__item">
                  <span className="map-legend__pin" style={{ background: '#ef4444' }}>✗</span>
                  <span>No exitosa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
