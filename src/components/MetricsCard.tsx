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
import { LoadingState } from './LoadingState'
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
}

export interface MetricsData {
  total: number
  successful: number
  unsuccessful: number
  defensores: number
  dailyStats?: DailyStat[]
  rejectionStats?: RejectionStat[]
  loadedAt: string
}

export interface DailyStat {
  date: string
  total: number
  successful: number
  unsuccessful: number
  defensores: number
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
    // Solo supervisor NO puede ver no exitosas
    canViewUnsuccessful: roleLower !== 'supervisor',
    // Todos pueden ver desglose diario excepto socializer (ve solo su día)
    canViewDailyBreakdown: roleLower !== 'socializer',
  }
}

/**
 * Calcular estadísticas por día desde una lista de encuestas
 */
const calculateDailyStats = (respondents: RespondentData[]): DailyStat[] => {
  const dailyMap = new Map<string, { total: number; successful: number; unsuccessful: number; defensores: number }>()
  
  respondents.forEach(r => {
    const dateStr = r.createdAt.split('T')[0]
    
    if (!dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, { total: 0, successful: 0, unsuccessful: 0, defensores: 0 })
    }
    
    const stat = dailyMap.get(dateStr)!
    stat.total++
    
    if (r.willingToRespond === true) {
      stat.successful++
    } else {
      stat.unsuccessful++
    }
    
    if ((r as any).isPatriaDefender === true) {
      stat.defensores++
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
  const unsuccessful = respondents.filter(r => r.willingToRespond === false)
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
  showDailyView = false,
  onMetricsLoaded,
  buttonLabel = 'Generar',
  autoLoad = false,
}) => {
  const { user } = useAuth()
  const [startDate, setStartDate] = useState(getTodayISO())
  const [endDate, setEndDate] = useState(getTodayISO())
  const [metrics, setMetrics] = useState<MetricsData>({
    total: 0,
    successful: 0,
    unsuccessful: 0,
    defensores: 0,
    rejectionStats: [],
    loadedAt: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectionBreakdown, setShowRejectionBreakdown] = useState(false)
  const [filter, setFilter] = useState<'all' | 'successful' | 'unsuccessful' | 'defensores'>('all')

  const userRole = user?.role?.role || ''
  const permissions = useMemo(() => validateMetricsPermissions(userRole), [userRole])

  /**
   * Cargar métricas usando el mismo endpoint que el mapa de encuestas
   * NOTA: El backend filtra automáticamente según el rol del usuario autenticado
   */
  const loadMetrics = async () => {
    if (!startDate || !endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }

    try {
      setIsLoading(true)

      // Usar el mismo endpoint que el mapa de encuestas
      // NOTA: El backend filtra automáticamente según el usuario autenticado (rol y permisos)
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

      // Calcular estadísticas
      const surveyStats = calculateSurveyStats(allSurveys)
      const defensoresCount = allSurveys.filter(r => (r as any).isPatriaDefender === true).length
      const dailyStats = calculateDailyStats(allSurveys)
      const rejectionStats = calculateRejectionStats(allSurveys)

      const newMetrics: MetricsData = {
        total: surveyStats.total,
        successful: surveyStats.successful,
        unsuccessful: surveyStats.unsuccessful,
        defensores: defensoresCount,
        dailyStats,
        rejectionStats,
        loadedAt: new Date().toISOString(),
      }

      setMetrics(newMetrics)
      onMetricsLoaded?.(newMetrics)
    } catch (error) {
      notificationService.handleApiError(error, 'Error al cargar métricas')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar métricas automáticamente si autoLoad=true
  useEffect(() => {
    if (autoLoad) {
      loadMetrics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad])

  const handleApplyFilters = () => {
    loadMetrics()
  }

  const handleClearFilters = () => {
    setStartDate(getTodayISO())
    setEndDate(getTodayISO())
    setMetrics({
      total: 0,
      successful: 0,
      unsuccessful: 0,
      defensores: 0,
      rejectionStats: [],
      loadedAt: '',
    })
    setFilter('all')
  }

  const handleMetricClick = (metricType: 'all' | 'successful' | 'unsuccessful' | 'defensores') => {
    setFilter(metricType)
    if (metricType === 'unsuccessful') {
      setShowRejectionBreakdown(!showRejectionBreakdown)
    } else {
      setShowRejectionBreakdown(false)
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="metrics-card">
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
            <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            {buttonLabel}
          </button>
          <button
            className="btn btn--primary"
            onClick={handleClearFilters}
            disabled={isLoading}
          >
            <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" /></svg>
            Limpiar
          </button>
        </div>

        {metrics.loadedAt && (
          <div className="filter-card__info">
            <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Mostrando métricas del {formatDateES(startDate)} al {formatDateES(endDate)}
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="reports-stats">
        <div
          className={`stat-card ${filter === 'all' ? 'stat-card--active' : ''}`}
          onClick={() => handleMetricClick('all')}
          style={{ cursor: 'pointer' }}
        >
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

        {permissions.canViewUnsuccessful && (
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
          className={`stat-card ${filter === 'defensores' ? 'stat-card--active' : ''}`}
          onClick={() => handleMetricClick('defensores')}
          style={{ cursor: 'pointer', backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}
        >
          <div className="stat-card__icon">
            <span style={{ fontSize: '1.5rem' }}>⭐</span>
          </div>
          <div className="stat-card__value">{metrics.defensores}</div>
          <div className="stat-card__label">Defensores de la Patria</div>
        </div>
      </div>

      {/* Motivos de rechazo */}
      {permissions.canViewUnsuccessful && showRejectionBreakdown && metrics.unsuccessful > 0 && (
        <div className="rejection-breakdown">
          <h3 className="rejection-breakdown__title">
            <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            Motivos de Rechazo
          </h3>
          <div className="rejection-breakdown__grid">
            {metrics.rejectionStats?.map((stat, index) => (
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
          {!metrics.rejectionStats || metrics.rejectionStats.length === 0 && (
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

      {/* Vista diaria si es aplicable */}
      {showDailyView && metrics.dailyStats && metrics.dailyStats.length > 0 && (
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
      )}
    </div>
  )
}

export default MetricsCard
