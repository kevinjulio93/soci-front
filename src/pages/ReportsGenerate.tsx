/**
 * ReportsGenerate - Generar reportes tabulares
 * Permite filtrar y exportar reportes por rango de fechas y socializador
 */

import { useState, useEffect } from 'react'
import { Sidebar } from '../components'
import { apiService } from '../services/api.service'
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

interface DailyStat {
  date: string
  totalSurveys: number
  enabledSurveys: number
  disabledSurveys: number
  surveys: unknown[]
}

interface SocializerReport {
  _id: string
  socializerName: string
  socializerIdNumber: string
  userEmail: string
  totalSurveys: number
  totalEnabled: number
  totalDisabled: number
  dailyStats: DailyStat[]
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
      console.error('Error loading socializers:', err)
      setError('Error al cargar socializadores')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const generateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
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
      
    } catch (err) {
      console.error('Error generating report:', err)
      setError('Error al generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportToCSV = () => {
    if (reportData.length === 0) {
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
                  <div className="form-group">
                    <label htmlFor="startDate" className="form-group__label">
                      Fecha inicio *
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      className="form-group__input"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endDate" className="form-group__label">
                      Fecha fin *
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      className="form-group__input"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="socializerId" className="form-group__label">
                      Socializador (opcional)
                    </label>
                    <select
                      id="socializerId"
                      className="form-group__input"
                      value={filters.socializerId}
                      onChange={(e) => handleFilterChange('socializerId', e.target.value)}
                      disabled={isGenerating || isLoading}
                    >
                      <option value="">Todos los socializadores</option>
                      {socializers.map((socializer) => (
                        <option key={socializer._id} value={socializer._id}>
                          {socializer.fullName} - {socializer.idNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="filter-card__actions">
                  <button
                    className="btn btn--primary"
                    onClick={generateReport}
                    disabled={isGenerating || !filters.startDate || !filters.endDate}
                  >
                    {isGenerating ? 'Generando...' : '📊 Generar Reporte'}
                  </button>
                  
                  {reportData.length > 0 && (
                    <button
                      className="btn btn--secondary"
                      onClick={exportToCSV}
                      disabled={isGenerating}
                    >
                      📥 Exportar CSV
                    </button>
                  )}
                </div>
              </div>
            </div>

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
                  <table className="survey-table">
                    <thead>
                      <tr>
                        <th className="survey-table__th">Socializador</th>
                        <th className="survey-table__th">ID</th>
                        <th className="survey-table__th">Email</th>
                        <th className="survey-table__th">Total Encuestas</th>
                        <th className="survey-table__th">Activas</th>
                        <th className="survey-table__th">Inactivas</th>
                        <th className="survey-table__th">Detalles por Día</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((socializer) => (
                        <tr key={socializer._id}>
                          <td className="survey-table__td">{socializer.socializerName}</td>
                          <td className="survey-table__td">{socializer.socializerIdNumber}</td>
                          <td className="survey-table__td">{socializer.userEmail}</td>
                          <td className="survey-table__td">
                            <strong>{socializer.totalSurveys}</strong>
                          </td>
                          <td className="survey-table__td">
                            <span style={{ color: '#28a745' }}>{socializer.totalEnabled}</span>
                          </td>
                          <td className="survey-table__td">
                            <span style={{ color: '#dc3545' }}>{socializer.totalDisabled}</span>
                          </td>
                          <td className="survey-table__td">
                            <details>
                              <summary style={{ cursor: 'pointer', color: '#4a7c6f' }}>
                                Ver {socializer.dailyStats.length} días
                              </summary>
                              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                {socializer.dailyStats.map((day, idx) => (
                                  <div key={idx} style={{ padding: '0.25rem 0', borderBottom: '1px solid #eee' }}>
                                    <strong>{day.date}:</strong> {day.totalSurveys} encuestas
                                    ({day.enabledSurveys} activas, {day.disabledSurveys} inactivas)
                                  </div>
                                ))}
                              </div>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
