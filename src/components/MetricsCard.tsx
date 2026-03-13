/**
 * MetricsCard - Componente reutilizable de métricas con validación de permisos jerárquica
 * Utilizado en: Admin Dashboard, Reports, Socializer Dashboard
 * Soporta filtrado por rango de fechas y visualización por día
 * USA EL MISMO ENDPOINT QUE EL MAPA DE ENCUESTAS para consistencia de datos
 */

import { useState, useEffect, useMemo } from 'react'
import { DateInput } from './DateInput'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { getTodayISO, formatDateES } from '../utils'
import { ToggleUnsuccessful } from './ToggleUnsuccessful'
import { useUnsuccessfulToggle } from '../hooks/useUnsuccessfulToggle'
import { RespondentData } from '../models/ApiResponses'
import { calculateSurveyStats } from '../utils'
import '../styles/MetricsCard.scss'

interface MetricsCardProps {
  /** Tipo de vista: admin, coordinador_zona, coordinador_campo, supervisor, socializer */
  viewType: 'admin' | 'coordinador_zona' | 'coordinador_campo' | 'supervisor' | 'socializer'
  /** Mostrar vista por día (true) o agregada (false) */
  showDailyView?: boolean
  /** Callback cuando se aplican filtros */
  onMetricsLoaded?: (data: MetricsData) => void
  /** Personalizar el nombre del botón (default: "Generar") */
  buttonLabel?: string
  /** Cargar métricas automáticamente al montar el componente */
  autoLoad?: boolean
  /** Página actual para la tabla unificada */
  page?: number
  /** Items por página para la tabla unificada */
  perPage?: number
  /** Key para forzar recarga desde afuera */
  refreshKey?: number
  /** Callback para notificar estado de carga */
  onLoading?: (isLoading: boolean) => void
}

export interface MetricsData {
  total: number
  successful: number
  unsuccessful: number
  defensores: number
  isVerified: number
  isLinkedHouse: number
  linkedHomes: number
  isOffline: number
  dailyStats?: DailyStat[]
  rejectionStats?: RejectionStat[]
  loadedAt: string
  startDate?: string
  endDate?: string
  surveys?: RespondentData[]
  pagination?: {
    page: number
    totalPages: number
    total: number
  }
}

export interface DailyStat {
  date: string
  total: number
  successful: number
  unsuccessful: number
  defensores: number
  isVerified: number
  isLinkedHouse: number
  linkedHomes: number
  isOffline: number
}

export interface RejectionStat {
  label: string
  count: number
  value: string
}

/**
 * Validar permisos según el rol del usuario
 */
export const validateMetricsPermissions = (userRole: string): { canViewUnsuccessful: boolean; canViewDailyBreakdown: boolean } => {
  const roleLower = userRole.toLowerCase()

  return {
    // Supervisor y socializer NO pueden ver no exitosas
    canViewUnsuccessful: roleLower !== 'supervisor' && roleLower !== 'socializer',
    // Todos pueden ver desglose diario excepto socializer (ve solo su día)
    canViewDailyBreakdown: roleLower !== 'socializer',
  }
}

/**
 * Calcular estadísticas por día desde una lista de encuestas
 */
const calculateDailyStats = (respondents: RespondentData[]): DailyStat[] => {
  const dailyMap = new Map<string, {
    total: number;
    successful: number;
    unsuccessful: number;
    defensores: number;
    isVerified: number;
    isLinkedHouse: number;
    linkedHomes: number;
    isOffline: number;
  }>()

  respondents.forEach(r => {
    if (!r.createdAt) return
    const dateStr = r.createdAt.split('T')[0]

    if (!dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, {
        total: 0,
        successful: 0,
        unsuccessful: 0,
        defensores: 0,
        isVerified: 0,
        isLinkedHouse: 0,
        linkedHomes: 0,
        isOffline: 0
      })
    }

    const stat = dailyMap.get(dateStr)!
    stat.total++

    if (r.surveyStatus === 'successful') {
      stat.successful++
    } else {
      stat.unsuccessful++
    }

    if (r.isPatriaDefender === true) {
      stat.defensores++
    }

    if (r.isVerified === true) {
      stat.isVerified++
    }

    if (r.isLinkedHouse === true) {
      stat.isLinkedHouse++
    }

    if ((r as any).linkedHomes === true) {
      stat.linkedHomes++
    }

    if ((r as any).isOffline === true) {
      stat.isOffline++
    }
  })

  return Array.from(dailyMap.entries())
    .map(([date, stat]) => ({ date, ...stat }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calcular estadísticas de motivos de rechazo
 */
const calculateRejectionStats = (respondents: RespondentData[]): RejectionStat[] => {
  const unsuccessful = respondents.filter(r => r && r.surveyStatus === 'unsuccessful')
  const stats = new Map<string, { label: string; count: number; value: string }>()

  unsuccessful.forEach(r => {
    const reason = r.noResponseReason || r.rejectionReason
    if (reason) {
      const reasonObj = reason as unknown as { value?: string; label?: string }
      const key = reasonObj.value || 'other'
      const label = reasonObj.label || 'Otro motivo'

      if (stats.has(key)) {
        stats.get(key)!.count++
      } else {
        stats.set(key, { label, count: 1, value: key })
      }
    } else {
      if (stats.has('no_specified')) {
        stats.get('no_specified')!.count++
      } else {
        stats.set('no_specified', { label: 'No especificado', count: 1, value: 'no_specified' })
      }
    }
  })

  return Array.from(stats.values()).sort((a, b) => b.count - a.count)
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  viewType: _viewType,
  // showDailyView = false,
  onMetricsLoaded,
  buttonLabel = 'Generar',
  autoLoad = false,
  page,
  perPage,
  refreshKey,
  onLoading,
}) => {
  const { user } = useAuth()
  const [startDate, setStartDate] = useState(getTodayISO())
  const [endDate, setEndDate] = useState(getTodayISO())
  const [metrics, setMetrics] = useState<MetricsData>({
    total: 0,
    successful: 0,
    unsuccessful: 0,
    defensores: 0,
    isVerified: 0,
    isLinkedHouse: 0,
    linkedHomes: 0,
    isOffline: 0,
    rejectionStats: [],
    loadedAt: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const userRole = user?.role?.role || ''
  const permissions = useMemo(() => validateMetricsPermissions(userRole), [userRole])
  const { showUnsuccessful } = useUnsuccessfulToggle()
  const [showRejectionBreakdown, setShowRejectionBreakdown] = useState(false)
  const [noExitosaDetalle, setNoExitosaDetalle] = useState<{
    noSeEncuentraEnCasa: number
    noEstaInteresado: number
    otraRazon: number
    noTieneTiempo: number
    preocupacionesDePrivacidad: number
  } | null>(null)
  const [filter, setFilter] = useState<'all' | 'successful' | 'unsuccessful' | 'defensores' | 'isVerified' | 'isLinkedHouse' | 'isOffline' | 'linkedHomes'>('all')

  /**
   * Cargar métricas usando el mismo endpoint que el mapa de encuestas
   * NOTA: El backend filtra automáticamente según el rol del usuario autenticado
   */
  const loadMetrics = async (overrideStartDate?: string, overrideEndDate?: string) => {
    const sDate = overrideStartDate || startDate
    const eDate = overrideEndDate || endDate

    if (!sDate || !eDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }

    try {
      setIsLoading(true)
      onLoading?.(true)

      // Usar el mismo endpoint que el mapa de encuestas
      // ... rest of loadMetrics ...
      // (Simplified for replacement chunk, actual content below)
      const response = await apiService.getReportsBySocializerAndDate(
        sDate,
        eDate,
        undefined,
        page,
        perPage
      )

      const surveysData = response.data?.surveys || []
      const allSurveys: RespondentData[] = surveysData.filter((s: any) => s != null).map((s: any) => new RespondentData(s))
      const surveyStats = calculateSurveyStats(allSurveys)
      const resumen = response.data?.resumen || response.resumen

      const defensoresCount = resumen?.totalIsPatriaDefender ?? resumen?.totalDefensores ??
        allSurveys.filter(r => r.isPatriaDefender === true).length
      const verifiedCount = resumen?.totalIsVerified ??
        allSurveys.filter(r => r.isVerified === true).length
      const linkedHouseCount = resumen?.totalIsLinkedHouse ??
        allSurveys.filter(r => r.isLinkedHouse === true).length
      const linkedHomesCount = resumen?.linkedHomes ??
        allSurveys.filter(r => (r as any).linkedHomes === true).length
      const offlineCount = resumen?.totalIsOffline ??
        allSurveys.filter(r => (r as any).isOffline === true).length

      const dailyStats = calculateDailyStats(allSurveys)
      const rejectionStats = calculateRejectionStats(allSurveys)

      // Guardar detalle de no exitosas desde el resumen del backend
      if (resumen?.noExitosaDetalle) {
        setNoExitosaDetalle(resumen.noExitosaDetalle)
      }

      const newMetrics: MetricsData = {
        total: resumen?.totalEncuestas ?? surveyStats.total,
        successful: resumen?.totalExitosa ?? resumen?.totalExitosas ?? surveyStats.successful,
        unsuccessful: resumen?.totalNoExitosa ?? resumen?.totalNoExitosas ?? surveyStats.unsuccessful,
        defensores: resumen?.totalPatriaDefender ?? resumen?.totalIsPatriaDefender ?? defensoresCount,
        isVerified: resumen?.totalVerified ?? resumen?.totalIsVerified ?? verifiedCount,
        isLinkedHouse: resumen?.totalLinkedHouse ?? resumen?.totalIsLinkedHouse ?? linkedHouseCount,
        linkedHomes: resumen?.linkedHomes ?? linkedHomesCount,
        isOffline: resumen?.totalIsOffline ?? offlineCount,
        dailyStats,
        rejectionStats,
        loadedAt: new Date().toISOString(),
        startDate,
        endDate,
        surveys: allSurveys,
        pagination: response.data?.pagination || {
          page: 1,
          totalPages: 1,
          total: allSurveys.length,
        },
      }

      setMetrics(newMetrics)
      onMetricsLoaded?.(newMetrics)
    } catch (error) {
      notificationService.handleApiError(error, 'Error al cargar métricas')
    } finally {
      setIsLoading(false)
      onLoading?.(false)
    }
  }

  // Cargar métricas automáticamente si autoLoad=true o si cambia la página/perPage
  useEffect(() => {
    if (autoLoad || (page !== undefined)) {
      loadMetrics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, page, perPage, refreshKey])

  const handleApplyFilters = () => {
    loadMetrics()
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

  const handleMetricClick = (metricType: 'all' | 'successful' | 'unsuccessful' | 'defensores' | 'isVerified' | 'isLinkedHouse' | 'isOffline' | 'linkedHomes') => {
    setFilter(metricType)
    if (metricType === 'unsuccessful') {
      setShowRejectionBreakdown(!showRejectionBreakdown)
    } else {
      setShowRejectionBreakdown(false)
    }
  }

  return (
    <div className={`metrics-card ${isLoading ? 'metrics-card--loading' : ''}`}>
      {/* Filtros de fecha */}
      <div className="metrics-card__filters filter-card">
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
            className="btn btn--primary btn--with-icon"
            onClick={handleApplyFilters}
            disabled={!startDate || !endDate || isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            {buttonLabel}
          </button>
        </div>

        {metrics.loadedAt && startDate && endDate && (
          <div className="filter-card__info">
            <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Mostrando métricas del {formatDateES(startDate)} al {formatDateES(endDate)}
          </div>
        )}

        {permissions.canViewUnsuccessful && (
          <ToggleUnsuccessful />
        )}
      </div>

      {/* Estadísticas */}
      <div className="reports-stats">
        {isLoading && (
          <div className="metrics-loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
        <div
          className={`stat-card stat-card--primary ${filter === 'all' ? 'stat-card--active' : ''}`}
          onClick={() => handleMetricClick('all')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-card__icon">
            <span style={{ fontSize: '1.2rem' }}>📊</span>
          </div>
          <div className="stat-card__value">{metrics.total}</div>
          <div className="stat-card__label">Total de Intervenciones</div>
        </div>

        <div
          className={`stat-card stat-card--success ${filter === 'successful' ? 'stat-card--active' : ''}`}
          onClick={() => handleMetricClick('successful')}
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
          <div className="stat-card__value">{metrics.successful}</div>
          <div className="stat-card__label">Exitosas</div>
        </div>

        {permissions.canViewUnsuccessful && showUnsuccessful && (
          <div
            className={`stat-card stat-card--danger ${filter === 'unsuccessful' ? 'stat-card--active' : ''}`}
            onClick={() => handleMetricClick('unsuccessful')}
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
            <div className="stat-card__value">{metrics.unsuccessful}</div>
            <div className="stat-card__label">No Exitosas</div>
          </div>
        )}

        <div
          className={`stat-card stat-card--warning ${filter === 'defensores' ? 'stat-card--active' : ''}`}
          onClick={() => handleMetricClick('defensores')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-card__icon">
            <span style={{ fontSize: '1.5rem' }}>⭐</span>
          </div>
          <div className="stat-card__value">{metrics.defensores}</div>
          <div className="stat-card__label">Defensores de la Patria</div>
        </div>

        <div
          className={`stat-card stat-card--info ${filter === 'isVerified' ? 'stat-card--active' : ''}`}
          onClick={() => handleMetricClick('isVerified')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-card__icon">
            <span style={{ fontSize: '1.5rem' }}>✅</span>
          </div>
          <div className="stat-card__value">{metrics.isVerified}</div>
          <div className="stat-card__label">Verificadas</div>
        </div>

        <div
          className={`stat-card stat-card--success ${filter === 'linkedHomes' ? 'stat-card--active' : ''}`}
          onClick={() => handleMetricClick('linkedHomes')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-card__icon">
            <span style={{ fontSize: '1.5rem' }}>🏠</span>
          </div>
          <div className="stat-card__value">{metrics.linkedHomes}</div>
          <div className="stat-card__label">HOGARES VINCULADOS</div>
        </div>

        <div
          className={`stat-card stat-card--purple ${filter === 'isLinkedHouse' ? 'stat-card--active' : ''}`}
          onClick={() => handleMetricClick('isLinkedHouse')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-card__icon">
            <span style={{ fontSize: '1.5rem' }}>➕</span>
          </div>
          <div className="stat-card__value">{metrics.isLinkedHouse}</div>
          <div className="stat-card__label">VINCULACIONES EXTRAS</div>
        </div>

        <div
          className={`stat-card stat-card--darkblue ${filter === 'isOffline' ? 'stat-card--active' : ''}`}
          onClick={() => handleMetricClick('isOffline')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-card__icon">
            <span style={{ fontSize: '1.2rem' }}>📡</span>
          </div>
          <div className="stat-card__value">{metrics.isOffline}</div>
          <div className="stat-card__label">Registro Sin Conexión</div>
        </div>
      </div>

      {/* Motivos de rechazo */}
      {permissions.canViewUnsuccessful && showUnsuccessful && showRejectionBreakdown && metrics.rejectionStats && metrics.rejectionStats.length > 0 && (
        <div className="dashboard__section rejection-breakdown-section" style={{ margin: '2rem 0' }}>
          <div className="dashboard__header-section" style={{ marginBottom: '1.5rem', padding: 0 }}>
            <h3 className="dashboard__section-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Motivos de Rechazo
            </h3>
            <p className="dashboard__section-desc">Desglose detallado de las {metrics.unsuccessful} encuestas no exitosas</p>
          </div>

          <div className="rejection-breakdown__grid">
            {(() => {
              const reasonLabels: Record<string, string> = {
                'noEstaInteresado': 'No está interesado',
                'noSeEncuentraEnCasa': 'No se encuentra en casa',
                'noTieneTiempo': 'No tiene tiempo',
                'otraRazon': 'Otra razón',
                'preocupacionesDePrivacidad': 'Preocupaciones de privacidad',
              }
              const reasonIcons: Record<string, string> = {
                'noEstaInteresado': '🚫',
                'noSeEncuentraEnCasa': '🏠',
                'noTieneTiempo': '⏳',
                'otraRazon': '📝',
                'preocupacionesDePrivacidad': '🔒',
              }
              const details: Record<string, number> = noExitosaDetalle || {}
              return Object.entries(details)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([key, count], index) => (
                  <div key={index} className="rejection-breakdown__item">
                    <div className="rejection-breakdown__icon-wrapper">
                      {reasonIcons[key] || '❓'}
                    </div>
                    <div className="rejection-breakdown__info">
                      <div className="rejection-breakdown__count">
                        {count}
                      </div>
                      <div className="rejection-breakdown__label">
                        {reasonLabels[key] || key}
                      </div>
                    </div>
                  </div>
                ))
            })()}
          </div>
        </div>
      )}

      {/* Vista diaria si es aplicable */}
      {/* {showDailyView && metrics.dailyStats && metrics.dailyStats.length > 0 && (
        <div className="daily-metrics">
          <h3 className="daily-metrics__title">Desglose por Día</h3>
          <div className="daily-metrics__grid">
            {metrics.dailyStats.map((day, index) => (
              <div key={index} className="daily-metric-card">
                <div className="daily-metric-card__date">{formatDateES(day.date)}</div>
                <div className="daily-metric-card__stat">
                  <span className="daily-metric-card__label">Total:</span>
                  <span className="daily-metric-card__value">{day.total}</span>
                </div>
                <div className="daily-metric-card__stat">
                  <span className="daily-metric-card__label">Exitosas:</span>
                  <span className="daily-metric-card__value daily-metric-card__value--success">{day.successful}</span>
                </div>
                {permissions.canViewUnsuccessful && (
                  <div className="daily-metric-card__stat">
                    <span className="daily-metric-card__label">No Exitosas:</span>
                    <span className="daily-metric-card__value daily-metric-card__value--danger">{day.unsuccessful}</span>
                  </div>
                )}
                {day.defensores > 0 && (
                  <div className="daily-metric-card__stat">
                    <span className="daily-metric-card__label">Defensores:</span>
                    <span className="daily-metric-card__value daily-metric-card__value--warning">⭐ {day.defensores}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )} */}
    </div>
  )
}

export default MetricsCard
