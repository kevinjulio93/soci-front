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

interface ReportData {
  _id: string
  socializerName: string
  socializerIdNumber: string
  surveyName: string
  respondentName: string
  respondentIdNumber: string
  completedAt: string
  location?: {
    lat: number
    long: number
  }
}

export default function ReportsGenerate() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [socializers, setSocializers] = useState<SocializerOption[]>([])
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
          .filter(s => s.status === 'enabled')
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
      
      // TODO: Implementar endpoint de reportes en el backend
      // const response = await apiService.generateReport(filters)
      // setReportData(response.data)
      
      // Datos de ejemplo por ahora
      setReportData([
        {
          _id: '1',
          socializerName: 'JUAN PÉREZ',
          socializerIdNumber: '1234567890',
          surveyName: 'Encuesta de Satisfacción 2024',
          respondentName: 'MARÍA GONZÁLEZ',
          respondentIdNumber: '9876543210',
          completedAt: new Date().toISOString(),
          location: { lat: 4.6097, long: -74.0817 },
        },
      ])
      
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
      'Encuesta',
      'Encuestado',
      'ID Encuestado',
      'Fecha Completado',
      'Latitud',
      'Longitud',
    ]

    const rows = reportData.map(item => [
      item.socializerName,
      item.socializerIdNumber,
      item.surveyName,
      item.respondentName,
      item.respondentIdNumber,
      new Date(item.completedAt).toLocaleString('es-CO'),
      item.location?.lat?.toFixed(6) || '',
      item.location?.long?.toFixed(6) || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_${filters.startDate}_${filters.endDate}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
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

            {reportData.length > 0 && (
              <div className="reports-generate__results">
                <div className="results-header">
                  <h3 className="results-header__title">
                    Resultados del Reporte
                  </h3>
                  <span className="results-header__count">
                    {reportData.length} {reportData.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                <div className="reports-table-container">
                  <table className="survey-table">
                    <thead>
                      <tr>
                        <th className="survey-table__th">Socializador</th>
                        <th className="survey-table__th">ID</th>
                        <th className="survey-table__th">Encuesta</th>
                        <th className="survey-table__th">Encuestado</th>
                        <th className="survey-table__th">ID Encuestado</th>
                        <th className="survey-table__th">Fecha</th>
                        <th className="survey-table__th">Ubicación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((item) => (
                        <tr key={item._id}>
                          <td className="survey-table__td">{item.socializerName}</td>
                          <td className="survey-table__td">{item.socializerIdNumber}</td>
                          <td className="survey-table__td">{item.surveyName}</td>
                          <td className="survey-table__td">{item.respondentName}</td>
                          <td className="survey-table__td">{item.respondentIdNumber}</td>
                          <td className="survey-table__td">{formatDate(item.completedAt)}</td>
                          <td className="survey-table__td">
                            {item.location ? (
                              <span className="location-info">
                                {item.location.lat.toFixed(4)}, {item.location.long.toFixed(4)}
                              </span>
                            ) : (
                              '-'
                            )}
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
