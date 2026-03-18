/**
 * AdminDashboard - Dashboard del administrador
 * Página de bienvenida con navegación a diferentes secciones
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout, StatCard, LoadingState, EmptyState, ToggleUnsuccessful, ChartIcon, FileIcon, Card, DateRangeFilter, StatsGrid, ExcelIcon } from '../components'
import { useUnsuccessfulToggle } from '../hooks/useUnsuccessfulToggle'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { MESSAGES } from '../constants'
import { getTodayISO } from '../utils/dateHelpers'
import '../styles/Dashboard.scss'

interface FilterState {
  startDate: string
  endDate: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [totalSurveys, setTotalSurveys] = useState<number>(0)
  const [topSocializers, setTopSocializers] = useState<Array<{
    socializerId: string;
    fullName: string;
    idNumber: string;
    userId: string;
    email: string;
    totalSurveys: number;
    successfulSurveys: number;
    unsuccessfulSurveys: number;
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    startDate: getTodayISO(),
    endDate: getTodayISO()
  })

  const { showUnsuccessful } = useUnsuccessfulToggle()




  const normalizeTopSocializers = (items: any[]) =>
    items.map((item: any) => ({
      socializerId: item.socializerId || item._id || item.id || item.userId,
      fullName: item.fullName || item.userName || item.name || item.profile?.fullName || 'Sin nombre',
      idNumber: item.idNumber || item.profile?.idNumber || '',
      userId: item.userId || item.user?._id || item.user?.id || item._id,
      email: item.email || item.user?.email || '',
      totalSurveys: item.totalSurveys ?? item.totalEncuestas ?? item.total ?? item.totalInterventions ?? 0,
      successfulSurveys: item.successfulSurveys ?? item.encuestasExitosas ?? item.success ?? item.successful ?? 0,
      unsuccessfulSurveys: item.unsuccessfulSurveys ?? item.encuestasNoExitosas ?? item.unsuccessful ?? item.failed ?? 0,
    }))

  const resolveUsuariosDependientes = (): string => {
    return 'ALL'
  }

  const loadDashboardData = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) return

    try {
      setIsLoading(true)
      const usuariosDependientes = resolveUsuariosDependientes()
      const data = await apiService.getAdminDashboardOverview({
        startDate: filters.startDate,
        endDate: filters.endDate,
        usuariosDependientes,
      })

      const total =
        data?.totalSurveys ??
        data?.totalEncuestados ??
        data?.totalInterventions ??
        data?.total ??
        data?.stats?.totalSurveys ??
        0

      const top =
        data?.top10Usuarios ??
        data?.topSocializers ??
        data?.top_socializers ??
        data?.stats?.topSocializers ??
        data?.ranking ??
        []

      setTotalSurveys(total)
      setTopSocializers(normalizeTopSocializers(Array.isArray(top) ? top : []))
    } catch (error) {
      notificationService.handleApiError(error, MESSAGES.STATS_LOAD_ERROR)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadDashboardData()
  }, [])



  const handleFilterChange = useCallback((field: keyof FilterState, value: string) => {
    setFilters(prev => {
      const updated = { ...prev, [field]: value }

      // Validar fechas
      if (field === 'startDate' && value && prev.endDate && value > prev.endDate) {
        updated.endDate = value
      } else if (field === 'endDate' && value && prev.startDate && value < prev.startDate) {
        updated.startDate = value
      }

      return updated
    })
  }, [])

  const handleGenerateReport = useCallback(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleExportExcel = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }
    try {
      const usuariosDependientes = resolveUsuariosDependientes()
      await apiService.exportDashboard001({
        fecha_inicio: filters.startDate,
        fecha_fin: filters.endDate,
        usuarios_dependientes: usuariosDependientes,
      })
      notificationService.success('Archivo Excel descargado exitosamente')
    } catch (error) {
      notificationService.handleApiError(error, 'Error al exportar el reporte')
    }
  }, [filters])

  return (
    <DashboardLayout title="Dashboard Administrativo">
      <div className="dashboard-layout__body">
        <div className="dashboard__header-section">
          <div className="dashboard__header-text">
            <h2 className="dashboard__section-title">¡Bienvenido, {user?.profile?.name || user?.fullName || user?.profile?.fullName || user?.email}!</h2>
            <p className="dashboard__section-desc">
              Resumen general del sistema
            </p>
          </div>
        </div>

        {/* Filtros de Reporte */}
        <DateRangeFilter
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={(val) => handleFilterChange('startDate', val)}
          onEndDateChange={(val) => handleFilterChange('endDate', val)}
          onApply={handleGenerateReport}
          isLoading={isLoading}
          applyIcon={<ChartIcon size={20} />}
          applyLabel="Generar Reporte"

          extraActions={
            <>
              <button
                className="btn btn--excel btn--with-icon"
                onClick={handleExportExcel}
              >
                <ExcelIcon size={20} />
                Exportar Excel
              </button>
              <ToggleUnsuccessful />
            </>
          }
        />


        {isLoading ? (
          <LoadingState message="Cargando estadísticas..." />
        ) : (
          <>
            <StatsGrid>
              <StatCard
                icon={<FileIcon size={32} />}
                value={totalSurveys.toLocaleString()}
                label="Total Intervenciones"
                variant="primary"
              />
            </StatsGrid>

            <Card title="Top 10 Socializadores" icon={<ChartIcon size={20} />}>
              <div className="ranking-list">
                {topSocializers.map((item, index) => (
                  <div key={item.socializerId} className="ranking-item">
                    <div className="ranking-item__position">
                      <span className={`ranking-badge ${index < 3 ? `ranking-badge--${index + 1}` : ''}`}>
                        #{index + 1}
                      </span>
                    </div>
                    <div className="ranking-item__info">
                      <h4 className="ranking-item__name">{item.fullName}</h4>
                      <p className="ranking-item__email">{item.email}</p>
                    </div>
                    <div className="ranking-item__stats">
                      <div className="ranking-item__main">
                        <span className="ranking-item__count">{item.totalSurveys}</span>
                        <span className="ranking-item__label">total</span>
                      </div>
                      <div className="ranking-item__breakdown">
                        <span className="ranking-item__detail ranking-item__detail--success">
                          {item.successfulSurveys} exitosas
                        </span>
                        {showUnsuccessful ? (
                          <span className="ranking-item__detail ranking-item__detail--unsuccessful">
                            {item.unsuccessfulSurveys} no exitosas
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
                {topSocializers.length === 0 && (
                  <EmptyState
                    title="No hay datos disponibles"
                    description="Aún no se han registrado socializadores"
                  />
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
