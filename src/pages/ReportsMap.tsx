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
import { DashboardLayout, ToggleUnsuccessful, ChartIcon, DateRangeFilter } from '../components'
import { MapStats } from './ReportsMapComponents/MapStats'
import { MapLegend } from './ReportsMapComponents/MapLegend'
import { RejectionBreakdown } from './ReportsMapComponents/RejectionBreakdown'
import { useUnsuccessfulToggle } from '../hooks/useUnsuccessfulToggle'
import { apiService } from '../services/api.service'
import { ROUTES, MESSAGES } from '../constants'
import { notificationService } from '../services/notification.service'
import { useAuth } from '../contexts/AuthContext'
import {
  filterRespondentsWithLocation,
  calculateMapCenter,
  calculateSurveyStats
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

type FilterType = 'all' | 'successful' | 'unsuccessful' | 'defensores' | 'isVerified' | 'isLinkedHouse' | 'isOffline' | 'linkedHomes'

export default function ReportsMap() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [allSurveys, setAllSurveys] = useState<RespondentData[]>([])
  const [mapSurveys, setMapSurveys] = useState<RespondentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMapLoading, setIsMapLoading] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [startDate, setStartDate] = useState(getTodayISO())
  const [endDate, setEndDate] = useState(getTodayISO())
  const [fetchedDateRange, setFetchedDateRange] = useState({ start: '', end: '' })
  const [showRejectionBreakdown, setShowRejectionBreakdown] = useState(false)
  const [noExitosaDetalle, setNoExitosaDetalle] = useState<{
    noSeEncuentraEnCasa: number
    noEstaInteresado: number
    otraRazon: number
    noTieneTiempo: number
    preocupacionesDePrivacidad: number
  } | null>(null)

  const { showUnsuccessful } = useUnsuccessfulToggle()
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
    filterRespondentsWithLocation(mapSurveys),
    [mapSurveys])

  // Construir estadísticas de motivos de rechazo desde el resumen del backend
  const rejectionStats = useMemo(() => {
    if (!noExitosaDetalle) return []

    const reasonLabels: Record<string, string> = {
      'noEstaInteresado': 'No está interesado',
      'noSeEncuentraEnCasa': 'No se encuentra en casa',
      'noTieneTiempo': 'No tiene tiempo',
      'otraRazon': 'Otra razón',
      'preocupacionesDePrivacidad': 'Preocupaciones de privacidad',
    }

    const items = Object.entries(noExitosaDetalle)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => ({
        key,
        label: reasonLabels[key] || key,
        count,
      }))
      .sort((a, b) => b.count - a.count)

    return items
  }, [noExitosaDetalle])

  const handleStatCardClick = (newFilter: string) => {
    const filterType = newFilter as FilterType
    setFilter(filterType)
    setShowRejectionBreakdown(filterType === 'unsuccessful' && !showRejectionBreakdown)
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
      const fetchedSurveys: RespondentData[] = surveysData.filter((s: any) => s != null).map((s: any) => new RespondentData(s))

      // Guardamos la base entera de encuestas para estadísticas fallback
      setAllSurveys(fetchedSurveys)
      if (filter === 'all') {
        setMapSurveys(fetchedSurveys)
      } else {
        fetchMapSurveys(filter, sDate, eDate)
      }

      const resumen = response.data?.resumen || response.resumen

      // Intenta usar los totales del backend, si no, los calcula iterando
      const newStats = calculateSurveyStats(allSurveys)
      const defensoresCount = resumen?.totalPatriaDefender ?? resumen?.totalIsPatriaDefender ?? allSurveys.filter(r => (r as any).isPatriaDefender === true).length
      const verifiedCount = resumen?.totalVerified ?? resumen?.totalIsVerified ?? allSurveys.filter(r => r.isVerified === true).length
      const linkedHouseCount = resumen?.totalLinkedHouse ?? resumen?.totalIsLinkedHouse ?? allSurveys.filter(r => r.isLinkedHouse === true).length
      const linkedHomesCount = resumen?.linkedHomes ?? allSurveys.filter(r => (r as any).linkedHomes === true).length
      const offlineCount = resumen?.totalIsOffline ?? allSurveys.filter(r => (r as any).isOffline === true).length

      // Guardar detalle de no exitosas desde el resumen del backend
      if (resumen?.noExitosaDetalle) {
        setNoExitosaDetalle(resumen.noExitosaDetalle)
      }

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
      const fetchedSurveys: RespondentData[] = surveysData.filter((s: any) => s != null).map((s: any) => new RespondentData(s))

      if (filterRespondentsWithLocation(fetchedSurveys).length === 0 && fetchedSurveys.length > 0) {
        console.warn('⚠️ Todas las encuestas fueron filtradas. Verificar estructura de datos.')
      }

      setAllSurveys(fetchedSurveys)
      if (filter === 'all') {
        setMapSurveys(fetchedSurveys)
      } else {
        fetchMapSurveys(filter, sDate, eDate)
      }

      const resumen = response.data?.resumen || response.resumen

      // Calcular estadísticas usando TODAS las encuestas (con y sin ubicación)
      const newStats = calculateSurveyStats(fetchedSurveys)
      const defensoresCount = resumen?.totalPatriaDefender ?? resumen?.totalIsPatriaDefender ?? fetchedSurveys.filter(r => (r as any).isPatriaDefender === true).length
      const verifiedCount = resumen?.totalVerified ?? resumen?.totalIsVerified ?? fetchedSurveys.filter(r => r.isVerified === true).length
      const linkedHouseCount = resumen?.totalLinkedHouse ?? resumen?.totalIsLinkedHouse ?? fetchedSurveys.filter(r => r.isLinkedHouse === true).length
      const linkedHomesCount = resumen?.linkedHomes ?? fetchedSurveys.filter(r => (r as any).linkedHomes === true).length
      const offlineCount = resumen?.totalIsOffline ?? fetchedSurveys.filter(r => (r as any).isOffline === true).length

      // Guardar detalle de no exitosas desde el resumen del backend
      if (resumen?.noExitosaDetalle) {
        setNoExitosaDetalle(resumen.noExitosaDetalle)
      }

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




  const handleApplyFilters = () => {
    loadFilteredRespondents()
  }

  // Efecto que re-obtiene las encuestas del mapa cuando se hace click en una métrica
  useEffect(() => {
    // Si la carga primaria (isLoading) aún está activa, evitamos hacer doble petición.
    if (!isLoading) {
      if (filter === 'all') {
        setMapSurveys(allSurveys)
      } else {
        const sDate = fetchedDateRange.start || startDate
        const eDate = fetchedDateRange.end || endDate
        fetchMapSurveys(filter, sDate, eDate)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const fetchMapSurveys = async (currentFilter: FilterType, sDate: string, eDate: string) => {
    try {
      setIsMapLoading(true)
      const response = await apiService.getReportsBySocializerAndDate(
        sDate, eDate, undefined, undefined, undefined, currentFilter
      )
      const surveysData = response.data?.surveys || []
      const fetchedSurveys = surveysData.filter((s: any) => s != null).map((s: any) => new RespondentData(s))
      setMapSurveys(fetchedSurveys)
    } catch (error) {
      console.error('Error fetching map surveys for metric:', error)
    } finally {
      setIsMapLoading(false)
    }
  }

  const mapCenter = useMemo(() => calculateMapCenter(respondentsWithLocation), [respondentsWithLocation])

  return (
    <DashboardLayout
      title="Mapa de Encuestas"
      onBack={handleBackToReports}
    >
      <div className="dashboard-layout__body">
        {/* Filtros de fecha */}
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onApply={handleApplyFilters}
          isLoading={isLoading}
          applyIcon={<ChartIcon size={20} />}
          applyLabel="Generar Reporte"
          extraActions={<ToggleUnsuccessful />}
        />

        {/* Estadísticas con filtros clickeables */}
        <MapStats
          stats={stats}
          filter={filter}
          onFilterChange={handleStatCardClick}
          canViewUnsuccessful={canViewUnsuccessful}
          showUnsuccessful={showUnsuccessful}
        />

        {/* Motivos de rechazo - Sección dedicada */}
        <RejectionBreakdown
          stats={stats}
          rejectionStats={rejectionStats}
          visible={canViewUnsuccessful && showUnsuccessful && showRejectionBreakdown && !!noExitosaDetalle}
        />

        {/* Mapa */}
        <div className={`dashboard-map-container ${isLoading ? 'dashboard-map-container--loading' : ''}`} style={{ position: 'relative' }}>
          {isLoading ? (
            <div className="metrics-loading-overlay" style={{ background: 'transparent' }}>
              <div className="spinner"></div>
            </div>
          ) : null}

          {/* Mensajes de aviso si no hay datos para mostrar en el mapa */}
          {!isLoading && allSurveys.length === 0 ? (
            <div className="map-empty-overlay">
              <p>No hay encuestas registradas para este periodo</p>
            </div>
          ) : null}
          {!isLoading && allSurveys.length > 0 && respondentsWithLocation.length === 0 && !isMapLoading ? (
            <div className="map-empty-overlay">
              <p>Las encuestas encontradas no tienen ubicación registrada o no hay datos para esta métrica</p>
            </div>
          ) : null}

          {isMapLoading ? (
            <div className="metrics-loading-overlay">
              <div className="spinner"></div>
            </div>
          ) : null}

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
            <SuperclusterLayer respondents={respondentsWithLocation} />
          </MapContainer>

          {/* Leyenda del mapa - visible solo en desktop como overlay */}
          <MapLegend />
        </div>

        {/* Leyenda del mapa - visible solo en mobile, debajo del mapa */}
        <MapLegend isMobile />
      </div>
    </DashboardLayout>
  )
}

