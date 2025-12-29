/**
 * ReportsGenerate - Generar reportes tabulares
 * Permite filtrar y exportar reportes por rango de fechas y socializador
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar, DateInput, Select } from '../components'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { ROUTES } from '../constants'
import '../styles/Dashboard.scss'

interface ReportFilters {
  startDate: string
  endDate: string
  socializerId: string
}

interface SocializerOption {
  _id: string
  fullName: string
  idNumber: string
}

interface Survey {
  _id: string
  fullName: string
  identification: string
  status: 'enabled' | 'disabled'
  createdAt: string
  defendorDePatria?: boolean
}

interface DailyStat {
  date: string
  totalSurveys: number
  enabledSurveys: number
  disabledSurveys: number
  surveys: Survey[]
}

interface SocializerReport {
  _id: string
  socializerName: string
  socializerIdNumber: string
  userEmail: string
  totalSurveys: number
  totalEnabled: number
  totalDisabled: number
  totalDefensores: number
  dailyStats: DailyStat[]
  allSurveys: Survey[]
}

interface ReportResponse {
  message: string
  data: {
    dateRange: {
      startDate: string
      endDate: string
    }
    totalSocializers: number
    report: SocializerReport[]
  }
}

export default function ReportsGenerate() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [socializers, setSocializers] = useState<SocializerOption[]>([])
  const [reportData, setReportData] = useState<SocializerReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportResponse, setReportResponse] = useState<ReportResponse | null>(null)
  
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    socializerId: '',
  })

  useEffect(() => {
    loadSocializers()
  }, [])

  const loadSocializers = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getSocializers(1, 1000)
      
      setSocializers(
        response.data
          .filter(s => {
            const role = typeof s.user?.role === 'string' 
              ? s.user.role 
              : s.user?.role?.role
            return role === 'socializer'
          })
          .map(s => ({
            _id: s._id,
            fullName: s.fullName,
            idNumber: s.idNumber,
          }))
      )
    } catch (err) {
      notificationService.handleApiError(err, 'Error al cargar socializadores')
      setError('Error al cargar socializadores')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleBackToReports = () => {
    navigate(ROUTES.ADMIN_REPORTS)
  }

  const generateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      setError('Por favor seleccione un rango de fechas')
      return
    }

    try {
      setIsGenerating(true)
      setError(null)
      
      const response = await apiService.getReportsBySocializerAndDate(
        filters.startDate,
        filters.endDate,
        filters.socializerId || undefined
      )
      
      setReportResponse(response)
      setReportData(response.data.report)
      notificationService.success('Reporte generado exitosamente')
      
    } catch (err) {
      notificationService.handleApiError(err, 'Error al generar el reporte')
      setError('Error al generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportToCSV = () => {
    if (reportData.length === 0) {
      notificationService.warning('No hay datos para exportar')
      setError('No hay datos para exportar')
      return
    }

    const headers = [
      'Socializador',
      'ID Socializador',
      'Email',
      'Total Encuestas',
      'Activas',
      'Inactivas',
      'Fecha',
      'Encuestas del Día',
    ]

    const rows: string[][] = []
    
    reportData.forEach(socializer => {
      socializer.dailyStats.forEach(day => {
        rows.push([
          socializer.socializerName,
          socializer.socializerIdNumber,
          socializer.userEmail,
          socializer.totalSurveys.toString(),
          socializer.totalEnabled.toString(),
          socializer.totalDisabled.toString(),
          day.date,
          day.totalSurveys.toString(),
        ])
      })
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_socializadores_${filters.startDate}_${filters.endDate}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button className="btn-back" onClick={handleBackToReports}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="dashboard-layout__title">Reportes - Generar Reporte Tabular</h1>
        </div>

        <div className="dashboard-layout__body">
          {error && (
            <div className="survey-form__error" style={{ marginBottom: '1rem' }}>
              <p>{error}</p>
            </div>
          )}

          <div className="reports-generate">
            <div className="reports-generate__filters">
              <div className="filter-card">
                <h3 className="filter-card__title">Filtros de Reporte</h3>
                
                <div className="filter-card__grid">
                  <DateInput
                    label="Fecha inicio"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    disabled={isGenerating}
                    required
                  />

                  <DateInput
                    label="Fecha fin"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    disabled={isGenerating}
                    required
                  />

                  <Select
                    label="Socializador (opcional)"
                    value={filters.socializerId}
                    onChange={(e) => handleFilterChange('socializerId', e.target.value)}
                    disabled={isGenerating || isLoading}
                    options={[
                      { value: '', label: 'Todos los socializadores' },
                      ...socializers.map((s) => ({
                        value: s._id,
                        label: `${s.fullName} - ${s.idNumber}`
                      }))
                    ]}
                    placeholder=""
                  />
                </div>

                <div className="filter-card__actions">
                  <button
                    className="btn btn--primary"
                    onClick={generateReport}
                    disabled={isGenerating || !filters.startDate || !filters.endDate}
                  >
                    {isGenerating ? 'Generando...' : '📊 Generar Reporte'}
                  </button>
                  
                  <button
                    className="btn btn--secondary"
                    onClick={exportToCSV}
                    disabled={isGenerating || reportData.length === 0}
                  >
                    📥 Exportar CSV
                  </button>
                </div>
              </div>
            </div>

            {reportData.length === 0 && !isGenerating && (
              <div className="empty-state">
                <div className="empty-state__icon">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="empty-state__title">No hay reportes generados</h3>
                <p className="empty-state__description">
                  Seleccione un rango de fechas y opcionalmente un socializador, luego haga clic en "Generar Reporte" para visualizar los datos.
                </p>
              </div>
            )}

            {reportData.length > 0 && reportResponse && (
              <div className="reports-generate__results">
                <div className="results-header">
                  <h3 className="results-header__title">
                    Resultados del Reporte
                  </h3>
                  <div className="results-header__info">
                    <span className="results-header__count">
                      {reportResponse.data.totalSocializers} {reportResponse.data.totalSocializers === 1 ? 'socializador' : 'socializadores'}
                    </span>
                    <span className="results-header__date-range">
                      {reportResponse.data.dateRange.startDate} - {reportResponse.data.dateRange.endDate}
                    </span>
                  </div>
                </div>

                <div className="reports-table-container">
                  {reportData.map((socializer) => (
                    <div key={socializer._id} style={{ marginBottom: '2rem', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                      {/* Header del socializador */}
                      <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderBottom: '2px solid #4a7c6f' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ margin: 0, color: '#4a7c6f', fontSize: '1.25rem' }}>
                              {socializer.socializerName}
                            </h3>
                            <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.875rem' }}>
                              ID: {socializer.socializerIdNumber} | Email: {socializer.userEmail}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4a7c6f' }}>
                              {socializer.totalSurveys}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>Total Encuestas</div>
                            <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                              <span style={{ color: '#28a745', marginRight: '0.5rem' }}>✓ {socializer.totalEnabled} activas</span>
                              <span style={{ color: '#dc3545', marginRight: '0.5rem' }}>✗ {socializer.totalDisabled} inactivas</span>
                              <span style={{ color: '#0066cc' }}>★ {socializer.totalDefensores || 0} defensores</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tabla de encuestas */}
                      <div style={{ overflow: 'auto' }}>
                        <table className="survey-table" style={{ width: '100%', marginBottom: 0 }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f1f3f5' }}>
                              <th className="survey-table__th" style={{ textAlign: 'left' }}>#</th>
                              <th className="survey-table__th" style={{ textAlign: 'left' }}>Nombre Completo</th>
                              <th className="survey-table__th" style={{ textAlign: 'left' }}>Identificación</th>
                              <th className="survey-table__th" style={{ textAlign: 'center' }}>Estado</th>
                              <th className="survey-table__th" style={{ textAlign: 'left' }}>Fecha Creación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {socializer.allSurveys && socializer.allSurveys.length > 0 ? (
                              socializer.allSurveys.map((survey, idx) => (
                                <tr key={survey._id} style={{ borderBottom: '1px solid #e9ecef' }}>
                                  <td className="survey-table__td" style={{ textAlign: 'left', fontWeight: 'bold', color: '#666' }}>
                                    {idx + 1}
                                  </td>
                                  <td className="survey-table__td" style={{ textAlign: 'left' }}>
                                    {survey.fullName}
                                  </td>
                                  <td className="survey-table__td" style={{ textAlign: 'left' }}>
                                    {survey.identification}
                                  </td>
                                  <td className="survey-table__td" style={{ textAlign: 'center' }}>
                                    <span style={{
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      backgroundColor: survey.status === 'enabled' ? '#d4edda' : '#f8d7da',
                                      color: survey.status === 'enabled' ? '#155724' : '#721c24'
                                    }}>
                                      {survey.status === 'enabled' ? 'ACTIVA' : 'INACTIVA'}
                                    </span>
                                  </td>
                                  <td className="survey-table__td" style={{ textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>
                                    {new Date(survey.createdAt).toLocaleString('es-CO', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                  No hay encuestas registradas
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportData.length === 0 && filters.startDate && filters.endDate && !isGenerating && (
              <div className="empty-state">
                <div className="empty-state__icon">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="empty-state__title">
                  Seleccione los filtros y genere un reporte
                </h2>
                <p className="empty-state__description">
                  Configure las fechas y opcionalmente un socializador específico para generar el reporte tabular.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
