/**
 * ReportsSocializers - Reporte por Rol
 * Muestra intervenciones, exitosas, no exitosas y defensores agrupados por usuario del rol seleccionado
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar, DateInput, Select, ToggleUnsuccessful } from '../components'
import { ReportTable } from '../components/ReportTable'
import { useUnsuccessfulToggle } from '../hooks/useUnsuccessfulToggle'
import { useAuth } from '../contexts/AuthContext'
import type { ReportTableColumn } from '../components/ReportTable'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { ROUTES } from '../constants'
import '../styles/Dashboard.scss'

// Tipo para fila agregada por usuario
interface SocializerRow {
  socializerId: string
  socializerName: string
  interventions: number
  successful: number
  unsuccessful: number
  defensores: number
  isLinkedHouse: number
  linkedHomes: number
  verificados: number
  isOffline: number
}

// Jerarquía de roles disponibles
const ROLE_HIERARCHY: { value: string; label: string }[] = [
  { value: 'zonecoordinator', label: 'Coordinadores de Zona' },
  { value: 'fieldcoordinator', label: 'Coordinadores de Campo' },
  { value: 'supervisor', label: 'Supervisores' },
  { value: 'socializer', label: 'Socializadores' },
]

// Obtener fecha actual en formato YYYY-MM-DD
const getTodayString = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Columnas de la tabla
const TABLE_COLUMNS: ReportTableColumn<SocializerRow>[] = [
  {
    key: 'socializer',
    label: 'Usuario',
    minWidth: '180px',
    render: (item) => (
      <span style={{ fontWeight: 600 }}>{item.socializerName}</span>
    ),
  },
  {
    key: 'interventions',
    label: 'Intervenciones',
    minWidth: '130px',
    align: 'center',
    render: (item) => (
      <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{item.interventions}</span>
    ),
  },
  {
    key: 'successful',
    label: 'Exitosas',
    minWidth: '100px',
    align: 'center',
    render: (item) => (
      <span className="rg-status-badge rg-status-badge--success">{item.successful}</span>
    ),
  },
  {
    key: 'unsuccessful',
    label: 'No Exitosas',
    minWidth: '110px',
    align: 'center',
    render: (item) => (
      <span className="rg-status-badge rg-status-badge--error">{item.unsuccessful}</span>
    ),
  },
  {
    key: 'defensores',
    label: 'Defensores de la Patria',
    minWidth: '170px',
    align: 'center',
    render: (item) => (
      <span style={{ fontWeight: 600, color: item.defensores > 0 ? '#0066cc' : '#999' }}>
        {item.defensores}
      </span>
    ),
  },
  {
    key: 'linkedHomes',
    label: 'Hogares Vinculados',
    minWidth: '130px',
    align: 'center',
    render: (item) => (
      <span style={{ fontWeight: 600, color: item.linkedHomes > 0 ? '#27ae60' : '#999' }}>
        {item.linkedHomes}
      </span>
    ),
  },
  {
    key: 'isLinkedHouse',
    label: 'Vinculaciones Extra',
    minWidth: '130px',
    align: 'center',
    render: (item) => (
      <span style={{ fontWeight: 600, color: item.isLinkedHouse > 0 ? '#8b5cf6' : '#999' }}>
        {item.isLinkedHouse}
      </span>
    ),
  },
  {
    key: 'verificados',
    label: 'Verificados',
    minWidth: '100px',
    align: 'center',
    render: (item) => (
      <span style={{ fontWeight: 600, color: item.verificados > 0 ? '#9b59b6' : '#999' }}>
        {item.verificados}
      </span>
    ),
  },
  {
    key: 'isOffline',
    label: 'Sin Conexión',
    minWidth: '110px',
    align: 'center',
    render: (item) => (
      <span style={{ fontWeight: 600, color: item.isOffline > 0 ? '#1e40af' : '#999' }}>
        {item.isOffline}
      </span>
    ),
  },
]

export default function ReportsSocializers() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [startDate, setStartDate] = useState(getTodayString())
  const [endDate, setEndDate] = useState(getTodayString())
  const [selectedRole, setSelectedRole] = useState('socializer')
  const [reportData, setReportData] = useState<SocializerRow[]>([])
  const [summaryData, setSummaryData] = useState<any>(null)

  const { showUnsuccessful } = useUnsuccessfulToggle()

  const userRole = user?.role?.role?.toLowerCase() || ''

  // Filtrar roles disponibles según la jerarquía del usuario
  const availableRoles = useMemo(() => {
    const roleOrder = ['zonecoordinator', 'fieldcoordinator', 'supervisor', 'socializer']
    const userRoleIndex = roleOrder.indexOf(userRole)

    if (userRole === 'admin' || userRole === 'readonly') {
      return ROLE_HIERARCHY
    }

    // Mostrar solo roles por debajo del actual
    const childRoles = roleOrder.slice(userRoleIndex + 1)
    return ROLE_HIERARCHY.filter(r => childRoles.includes(r.value))
  }, [userRole])

  const handleBackToReports = () => navigate(ROUTES.ADMIN_REPORTS)

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

  const generateReport = async () => {
    if (!startDate || !endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }
    try {
      setIsGenerating(true)

      const params: { fecha_inicio: string; fecha_fin: string; rol?: string } = {
        fecha_inicio: startDate,
        fecha_fin: endDate,
      }
      if (selectedRole) {
        params.rol = selectedRole
      }

      const response = await apiService.getDashboard003Report(params)
      const socializadores = response.socializadores || []

      const rows: SocializerRow[] = socializadores.map((s) => ({
        socializerId: s.socializadorId,
        socializerName: s.socializador,
        interventions: s.intervenciones,
        successful: s.exitosas,
        unsuccessful: s.noExitosas,
        defensores: s.defensoresDeLaPatria,
        isLinkedHouse: s.isLinkedHouse || 0,
        linkedHomes: s.linkedHomes || 0,
        verificados: s.verificados || 0,
        isOffline: s.isOffline || 0,
      })).sort((a, b) => b.interventions - a.interventions)

      setReportData(rows)
      setSummaryData(response.resumen || null)

      const rolLabel = availableRoles.find(r => r.value === selectedRole)?.label || 'usuarios'
      notificationService.success(`Reporte generado: ${rows.length} ${rolLabel.toLowerCase()}, ${response.resumen?.totalEncuestas ?? rows.reduce((s, r) => s + r.interventions, 0)} intervenciones`)
    } catch (err) {
      notificationService.handleApiError(err, 'Error al generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportToExcel = async () => {
    if (!startDate || !endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }
    try {
      const params: { fecha_inicio: string; fecha_fin: string; rol?: string } = {
        fecha_inicio: startDate,
        fecha_fin: endDate,
      }
      if (selectedRole) {
        params.rol = selectedRole
      }
      await apiService.exportDashboard003(params)
      notificationService.success('Archivo Excel descargado exitosamente')
    } catch (err) {
      notificationService.handleApiError(err, 'Error al exportar el reporte')
    }
  }

  // Totales
  const totals = reportData.reduce(
    (acc, r) => ({
      interventions: acc.interventions + r.interventions,
      successful: acc.successful + r.successful,
      unsuccessful: acc.unsuccessful + r.unsuccessful,
      defensores: acc.defensores + r.defensores,
      isLinkedHouse: acc.isLinkedHouse + r.isLinkedHouse,
      linkedHomes: acc.linkedHomes + r.linkedHomes,
      verificados: acc.verificados + r.verificados,
      isOffline: acc.isOffline + r.isOffline,
    }),
    { interventions: 0, successful: 0, unsuccessful: 0, defensores: 0, isLinkedHouse: 0, linkedHomes: 0, verificados: 0, isOffline: 0 }
  )

  const hasData = reportData.length > 0

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-layout__content">
        {/* Header */}
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
          <h1 className="dashboard-layout__title">Reportes - Reporte por Rol</h1>
        </div>

        <div className="dashboard-layout__body">
          {/* Filtros */}
          <div className="filter-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="filter-card__title">
              <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filtros del Reporte
            </h3>

            <div className="filter-card__grid">
              <div className="filter-card__field">
                <DateInput
                  label="Fecha Inicio"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>
              <div className="filter-card__field">
                <DateInput
                  label="Fecha Fin"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>
              <div className="filter-card__field">
                <Select
                  label="Rol"
                  options={availableRoles}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className="filter-card__actions">
              <button
                className="btn btn--primary btn--with-icon"
                onClick={generateReport}
                disabled={!startDate || !endDate || isGenerating}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Generar Reporte
              </button>
              {hasData && (
                <button
                  className="btn btn--secondary"
                  onClick={exportToExcel}
                  disabled={isGenerating}
                >
                  <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Exportar Excel
                </button>
              )}
            </div>

            {/* Info de filtros activos */}
            {hasData && (
              <div className="filter-card__info">
                <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {startDate} al {endDate}
                {selectedRole && ` — Rol: ${availableRoles.find(r => r.value === selectedRole)?.label || selectedRole}`}
                {` — ${reportData.length} usuarios, ${totals.interventions} intervenciones`}
              </div>
            )}

            <ToggleUnsuccessful />
          </div>

          {/* Totales */}
          {hasData && (
            <div className="reports-stats" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card stat-card--primary">
                <div className="stat-card__icon">
                  <span style={{ fontSize: '1.2rem' }}>📊</span>
                </div>
                <div className="stat-card__value">{summaryData?.totalEncuestas ?? summaryData?.totalIntervenciones ?? totals.interventions}</div>
                <div className="stat-card__label">Total de Intervenciones</div>
              </div>
              <div className="stat-card stat-card--success">
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
                <div className="stat-card__value">{summaryData?.totalExitosas ?? totals.successful}</div>
                <div className="stat-card__label">Exitosas</div>
              </div>
              {showUnsuccessful && (
                <div className="stat-card stat-card--danger">
                  <div className="stat-card__icon">
                    <span style={{ fontSize: '1.5rem' }}>❌</span>
                  </div>
                  <div className="stat-card__value">{summaryData?.totalNoExitosas ?? totals.unsuccessful}</div>
                  <div className="stat-card__label">No Exitosas</div>
                </div>
              )}
              <div className="stat-card stat-card--warning">
                <div className="stat-card__icon">
                  <span style={{ fontSize: '1.5rem' }}>⭐</span>
                </div>
                <div className="stat-card__value">{summaryData?.totalIsPatriaDefender ?? summaryData?.totalDefensores ?? totals.defensores}</div>
                <div className="stat-card__label">Defensores de la Patria</div>
              </div>
              <div className="stat-card stat-card--success">
                <div className="stat-card__icon">
                  <span style={{ fontSize: '1.5rem' }}>🏠</span>
                </div>
                <div className="stat-card__value">{summaryData?.linkedHomes ?? summaryData?.totalLinkedHomes ?? totals.linkedHomes}</div>
                <div className="stat-card__label">HOGARES VINCULADOS</div>
              </div>
              <div className="stat-card stat-card--purple">
                <div className="stat-card__icon">
                  <span style={{ fontSize: '1.5rem' }}>➕</span>
                </div>
                <div className="stat-card__value">{summaryData?.totalIsLinkedHouse ?? totals.isLinkedHouse}</div>
                <div className="stat-card__label">VINCULACIONES EXTRAS</div>
              </div>
              <div className="stat-card stat-card--info">
                <div className="stat-card__icon">
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                </div>
                <div className="stat-card__value">{summaryData?.totalIsVerified ?? summaryData?.totalVerificados ?? totals.verificados}</div>
                <div className="stat-card__label">Verificadas</div>
              </div>
              <div className="stat-card stat-card--darkblue">
                <div className="stat-card__icon">
                  <span style={{ fontSize: '1.2rem' }}>📡</span>
                </div>
                <div className="stat-card__value">{summaryData?.totalIsOffline ?? totals.isOffline}</div>
                <div className="stat-card__label">Registro Sin Conexión</div>
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="rg-table-container">
            <ReportTable<SocializerRow>
              columns={showUnsuccessful ? TABLE_COLUMNS : TABLE_COLUMNS.filter(c => c.key !== 'unsuccessful')}
              data={reportData}
              getRowKey={(item) => item.socializerId}
              isLoading={isGenerating}
              emptyTitle="Sin datos"
              emptyDescription="Seleccione un rango de fechas, un rol y haga clic en Generar Reporte para ver el resumen."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
