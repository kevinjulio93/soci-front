/**
 * ReportsSocializers - Reporte resumen por socializador
 * Muestra intervenciones, exitosas, no exitosas y defensores agrupados por socializador
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar, DateInput } from '../components'
import { ReportTable } from '../components/ReportTable'
import type { ReportTableColumn } from '../components/ReportTable'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { ROUTES } from '../constants'
import '../styles/Dashboard.scss'

// Tipo para fila agregada por socializador
interface SocializerRow {
  socializerId: string
  socializerName: string
  interventions: number
  successful: number
  unsuccessful: number
  defensores: number
}

// Obtener fecha actual en formato YYYY-MM-DD
const getTodayString = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Columnas de la tabla
const TABLE_COLUMNS: ReportTableColumn<SocializerRow>[] = [
  {
    key: 'socializer',
    label: 'Socializador',
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
]

export default function ReportsSocializers() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [startDate, setStartDate] = useState(getTodayString())
  const [endDate, setEndDate] = useState(getTodayString())
  const [municipality, setMunicipality] = useState('')
  const [reportData, setReportData] = useState<SocializerRow[]>([])

  const handleBackToReports = () => navigate(ROUTES.ADMIN_REPORTS)

  const generateReport = async () => {
    if (!startDate || !endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }
    try {
      setIsGenerating(true)

      const params: { fecha_inicio: string; fecha_fin: string; municipio?: string } = {
        fecha_inicio: startDate,
        fecha_fin: endDate,
      }
      if (municipality.trim()) {
        params.municipio = municipality.trim()
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
      })).sort((a, b) => b.interventions - a.interventions)

      setReportData(rows)

      notificationService.success(`Reporte generado: ${rows.length} socializadores, ${response.resumen?.totalIntervenciones ?? rows.reduce((s, r) => s + r.interventions, 0)} intervenciones`)
    } catch (err) {
      notificationService.handleApiError(err, 'Error al generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClear = () => {
    setStartDate(getTodayString())
    setEndDate(getTodayString())
    setMunicipality('')
    setReportData([])
  }

  const exportToExcel = async () => {
    if (!startDate || !endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }
    try {
      const params: { fecha_inicio: string; fecha_fin: string; municipio?: string } = {
        fecha_inicio: startDate,
        fecha_fin: endDate,
      }
      if (municipality.trim()) {
        params.municipio = municipality.trim()
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
    }),
    { interventions: 0, successful: 0, unsuccessful: 0, defensores: 0 }
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
          <h1 className="dashboard-layout__title">Reportes - Resumen por Socializador</h1>
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
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>
              <div className="filter-card__field">
                <DateInput
                  label="Fecha Fin"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>
              <div className="filter-card__field">
                <label className="form-group__label">Municipio</label>
                <input
                  type="text"
                  className="form-group__input"
                  placeholder="Ej: Soledad"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className="filter-card__actions">
              <button
                className="btn btn--primary"
                onClick={generateReport}
                disabled={!startDate || !endDate || isGenerating}
              >
                <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Generar Reporte
              </button>
              <button
                className="btn btn--primary"
                onClick={handleClear}
                disabled={isGenerating}
              >
                <svg style={{ display: 'inline-block', width: '1em', height: '1em', marginRight: '0.5rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                </svg>
                Limpiar Filtros
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
                {municipality && ` — Municipio: ${municipality}`}
                {` — ${reportData.length} socializadores, ${totals.interventions} intervenciones`}
              </div>
            )}
          </div>

          {/* Totales */}
          {hasData && (
            <div className="reports-stats" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <div className="stat-card__value">{totals.interventions}</div>
                <div className="stat-card__label">Total Intervenciones</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value" style={{ color: '#27ae60' }}>{totals.successful}</div>
                <div className="stat-card__label">Exitosas</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value" style={{ color: '#e74c3c' }}>{totals.unsuccessful}</div>
                <div className="stat-card__label">No Exitosas</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value" style={{ color: '#0066cc' }}>{totals.defensores}</div>
                <div className="stat-card__label">Defensores de la Patria</div>
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="rg-table-container">
            <ReportTable<SocializerRow>
              columns={TABLE_COLUMNS}
              data={reportData}
              getRowKey={(item) => item.socializerId}
              isLoading={isGenerating}
              emptyTitle="Sin datos"
              emptyDescription="Seleccione un rango de fechas y haga clic en Generar Reporte para ver el resumen por socializador."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
