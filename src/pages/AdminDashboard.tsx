/**
 * AdminDashboard - Dashboard del administrador
 * Página de bienvenida con navegación a diferentes secciones
 */

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Sidebar, StatCard, LoadingState, EmptyState, MenuIcon, DateInput, Select } from '../components'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { MESSAGES } from '../constants'
import { getTodayISO } from '../utils/dateHelpers'
import '../styles/Dashboard.scss'

interface FilterState {
  startDate: string
  endDate: string
  zoneCoordinator: string
  fieldCoordinator: string
  supervisor: string
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    endDate: getTodayISO(),
    zoneCoordinator: '',
    fieldCoordinator: '',
    supervisor: ''
  })

  // Listas para los dropdowns
  const [zoneCoordinators, setZoneCoordinators] = useState<Array<{ value: string; label: string }>>([])
  const [fieldCoordinators, setFieldCoordinators] = useState<Array<{ value: string; label: string }>>([])
  const [supervisors, setSupervisors] = useState<Array<{ value: string; label: string }>>([])


  // Determinar rol del usuario (useMemo para evitar recalcular)
  const userRole = user?.role?.role?.toLowerCase() || ''

  // Determinar qué dropdowns mostrar según el rol (useMemo para evitar recrear objeto)
  const showFilters = useMemo(() => ({
    zoneCoordinator: userRole === 'admin' || userRole === 'readonly',
    fieldCoordinator: userRole === 'admin' || userRole === 'readonly' || userRole === 'zonecoordinator',
    supervisor: userRole === 'admin' || userRole === 'readonly' || userRole === 'zonecoordinator' || userRole === 'fieldcoordinator'
  }), [userRole])

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
    if (filters.supervisor) return filters.supervisor
    if (filters.fieldCoordinator) return filters.fieldCoordinator
    if (filters.zoneCoordinator) return filters.zoneCoordinator
    return 'ALL'
  }

  const loadDashboardData = async () => {
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
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user?.id) return

      try {
        if (userRole === 'admin' || userRole === 'readonly') {
          // Admin y readonly ven todos los coordinadores de zona
          const data = await apiService.getZoneCoordinators()
          setZoneCoordinators(data.map((s: any) => ({ value: s._id, label: s.fullName })))
        } else if (userRole === 'zonecoordinator') {
          // Coordinador de zona carga sus coordinadores de campo automáticamente
          const data = await apiService.getSubordinatesByRole(user.id, 'fieldcoordinator')
          setFieldCoordinators(data.map((s: any) => ({ value: s._id, label: s.fullName })))
        } else if (userRole === 'fieldcoordinator') {
          // Coordinador de campo carga sus supervisores automáticamente
          const data = await apiService.getSubordinatesByRole(user.id, 'supervisor')
          setSupervisors(data.map((s: any) => ({ value: s._id, label: s.fullName })))
          // Auto-seleccionar su propio ID para los filtros
          setFilters(prev => ({
            ...prev,
            fieldCoordinator: user.id
          }))
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }

    loadInitialData()
  }, [userRole, user?.id])

  // Cargar coordinadores de campo cuando se selecciona una zona
  useEffect(() => {
    const loadFieldCoordinatorsForZone = async () => {
      if (filters.zoneCoordinator && filters.zoneCoordinator !== '') {
        try {
          const data = await apiService.getSubordinatesByRole(filters.zoneCoordinator, 'fieldcoordinator')
          setFieldCoordinators(data.map((s: any) => ({ value: s._id, label: s.fullName })))
          // Resetear los filtros dependientes
          setFilters(prev => ({
            ...prev,
            fieldCoordinator: '',
            supervisor: ''
          }))
          setSupervisors([])
        } catch (error) {
          console.error('Error loading field coordinators:', error)
        }
      }
    }

    loadFieldCoordinatorsForZone()
  }, [filters.zoneCoordinator])

  // Cargar supervisores cuando se selecciona un coordinador de campo
  useEffect(() => {
    const loadSupervisorsForField = async () => {
      if (filters.fieldCoordinator && filters.fieldCoordinator !== '') {
        try {
          const data = await apiService.getSubordinatesByRole(filters.fieldCoordinator, 'supervisor')
          setSupervisors(data.map((s: any) => ({ value: s._id, label: s.fullName })))
          // Resetear los filtros dependientes
          setFilters(prev => ({
            ...prev,
            supervisor: ''
          }))
        } catch (error) {
          console.error('Error loading supervisors:', error)
        }
      }
    }

    loadSupervisorsForField()
  }, [filters.fieldCoordinator])

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => {
      const updated = { ...prev, [field]: value }
      
      // Limpiar filtros en cascada cuando se cambia un valor superior
      if (field === 'zoneCoordinator') {
        updated.fieldCoordinator = ''
        updated.supervisor = ''
        setFieldCoordinators([])
        setSupervisors([])
      } else if (field === 'fieldCoordinator') {
        updated.supervisor = ''
        setSupervisors([])
      }
      
      return updated
    })
  }

  const handleGenerateReport = () => {
    loadDashboardData()
  }

  const handleExportExcel = async () => {
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
            <MenuIcon size={24} />
          </button>
          <h1 className="dashboard-layout__title">Dashboard Administrativo</h1>
        </div>

        <div className="dashboard-layout__body">
          <div className="dashboard__header-section">
            <div className="dashboard__header-text">
              <h2 className="dashboard__section-title">¡Bienvenido, {user?.fullName || user?.profile?.fullName || user?.email}!</h2>
              <p className="dashboard__section-desc">
                Resumen general del sistema
              </p>
            </div>
          </div>

          {/* Filtros de Reporte */}
          <div className="report-filters-card">
            <h3 className="report-filters-card__title">Filtros de Reporte</h3>
            
            <div className="report-filters-grid">
              {/* Fechas - siempre visibles */}
              <DateInput
                label="Fecha Inicio"
                required
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                placeholder="mm/dd/yyyy"
              />
              
              <DateInput
                label="Fecha Fin"
                required
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                placeholder="mm/dd/yyyy"
              />

              {/* Coordinador de Zona - solo admin */}
              {showFilters.zoneCoordinator && (
                <Select
                  label="Coordinador de Zona"
                  options={zoneCoordinators}
                  value={filters.zoneCoordinator}
                  onChange={(e) => handleFilterChange('zoneCoordinator', e.target.value)}
                  placeholder="Todos los coordinadores de zona"
                />
              )}

              {/* Coordinador de Campo - admin y coordinador de zona */}
              {showFilters.fieldCoordinator && (
                <Select
                  label="Coordinador de Campo"
                  options={fieldCoordinators}
                  value={filters.fieldCoordinator}
                  onChange={(e) => handleFilterChange('fieldCoordinator', e.target.value)}
                  placeholder="Todos los coordinadores de campo"
                  disabled={userRole === 'admin' && !filters.zoneCoordinator}
                />
              )}

              {/* Supervisor - admin, coordinador de zona y coordinador de campo */}
              {showFilters.supervisor && (
                <Select
                  label="Supervisor"
                  options={supervisors}
                  value={filters.supervisor}
                  onChange={(e) => handleFilterChange('supervisor', e.target.value)}
                  placeholder="Todos los supervisores"
                  disabled={userRole === 'admin' && !filters.fieldCoordinator}
                />
              )}


            </div>

            <div className="report-filters-card__actions">
              <button 
                className="btn btn--primary btn--with-icon"
                onClick={handleGenerateReport}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Generar Reporte
              </button>
              
              <button 
                className="btn btn--outline btn--with-icon"
                onClick={handleExportExcel}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Exportar Excel
              </button>
            </div>
          </div>

          {isLoading ? (
            <LoadingState message="Cargando estadísticas..." />
          ) : (
            <>
              <div className="stats-grid">
                <StatCard 
                  icon={(
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  value={totalSurveys.toLocaleString()}
                  label="Total Intervenciones"
                  variant="primary"
                />
              </div>

              <div className="dashboard__section" style={{ marginTop: '2rem' }}>
                <h3 className="dashboard__section-subtitle">Top 10 Socializadores</h3>
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
                          <span className="ranking-item__detail ranking-item__detail--unsuccessful">
                            {item.unsuccessfulSurveys} no exitosas
                          </span>
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
