/**
 * ReportsGenerate - Generar reportes tabulares
 * Permite filtrar y exportar reportes con múltiples parámetros de búsqueda
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar, DateInput, Select, Input } from '../components'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { ROUTES } from '../constants'
import '../styles/Dashboard.scss'

interface ReportFilters {
  startDate: string
  endDate: string
  q: string
  surveyStatus: '' | 'successful' | 'unsuccessful'
  willingToRespond: '' | 'true' | 'false'
  isPatriaDefender: '' | 'true' | 'false'
  department: string
  city: string
  region: string
  neighborhood: string
  gender: string
  ageRange: string
  stratum: string
  idType: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface ReportItem {
  _id: string
  willingToRespond: boolean
  surveyStatus: 'successful' | 'unsuccessful'
  recordingAuthorization: boolean
  fullName: string
  idType?: string
  identification?: string
  email?: string
  phone?: string
  address?: string
  ageRange?: string
  region: string
  department: string
  city?: string
  gender?: string
  stratum?: number
  neighborhood?: string
  isPatriaDefender: boolean
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  autor: {
    _id: string
    email: string
    role: string
  }
  createdAt: string
  updatedAt: string
  audioFileKey?: string
  socializer: {
    _id: string
    fullName: string
    idNumber: string
    phone: string
  }
  rejectionReason?: {
    value: string
    label: string
  }
  noResponseReason?: {
    value: string
    label: string
  }
  visitAddress?: string
}

interface Dashboard002Response {
  message: string
  data: {
    currentPage: number
    itemsPerPage: number
    totalItems: number
    totalPages: number
    filters: Record<string, unknown>
    surveys: ReportItem[]
  }
}

export default function ReportsGenerate() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportResponse, setReportResponse] = useState<Dashboard002Response | null>(null)
  const [reportData, setReportData] = useState<ReportItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    q: '',
    surveyStatus: '',
    willingToRespond: '',
    isPatriaDefender: '',
    department: '',
    city: '',
    region: '',
    neighborhood: '',
    gender: '',
    ageRange: '',
    stratum: '',
    idType: '',
    sortBy: '',
    sortOrder: 'asc',
  })

  useEffect(() => {
    // No se necesita cargar datos iniciales
  }, [])

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleBackToReports = () => {
    navigate(ROUTES.ADMIN_REPORTS)
  }

  const generateReport = async (page: number = 1) => {
    if (!filters.startDate || !filters.endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      setError('Por favor seleccione un rango de fechas')
      return
    }

    try {
      setIsGenerating(true)
      setError(null)
      
      // Construir parámetros para el nuevo endpoint dashboard002
      const dashboardParams = {
        page: page,
        perPage: itemsPerPage,
        startDate: filters.startDate,
        endDate: filters.endDate,
        q: filters.q || undefined,
        surveyStatus: filters.surveyStatus || undefined,
        willingToRespond: filters.willingToRespond ? filters.willingToRespond === 'true' : undefined,
        isPatriaDefender: filters.isPatriaDefender ? filters.isPatriaDefender === 'true' : undefined,
        department: filters.department || undefined,
        city: filters.city || undefined,
        region: filters.region || undefined,
        neighborhood: filters.neighborhood || undefined,
        gender: filters.gender || undefined,
        ageRange: filters.ageRange || undefined,
        stratum: filters.stratum || undefined,
        idType: filters.idType || undefined,
        sortBy: filters.sortBy || undefined,
        sortOrder: filters.sortOrder,
      }
      
      const response = await apiService.getDashboard002Report(dashboardParams)
      
      setReportResponse(response)
      setReportData(response.data.surveys || [])
      setCurrentPage(page)
      
      notificationService.success(`Reporte generado exitosamente: ${response.data.totalItems} registros`)
      
    } catch (err) {
      notificationService.handleApiError(err, 'Error al generar el reporte')
      setError('Error al generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePageChange = (page: number) => {
    generateReport(page)
  }

  const exportToCSV = () => {
    if (reportData.length === 0) {
      notificationService.warning('No hay datos para exportar')
      setError('No hay datos para exportar')
      return
    }

    const headers = [
      'N°',
      'Nombre Completo',
      'Identificación',
      'Email',
      'Teléfono',
      'Género',
      'Edad',
      'Estrato',
      'Departamento',
      'Ciudad',
      'Región',
      'Barrio',
      'Defensor Patria',
      'Estado Encuesta',
      'Dispuesto Responder',
      'Socializer',
      'Fecha Creación',
    ]

    const rows: string[][] = reportData.map((item, idx) => [
      (idx + 1).toString(),
      item.fullName,
      item.identification || '',
      item.email || '',
      item.phone || '',
      item.gender || '',
      item.ageRange || '',
      item.stratum ? item.stratum.toString() : '',
      item.department || '',
      item.city || '',
      item.region || '',
      item.neighborhood || '',
      item.isPatriaDefender ? 'Sí' : 'No',
      item.surveyStatus === 'successful' ? 'Exitosa' : 'No Exitosa',
      item.willingToRespond ? 'Sí' : 'No',
      item.socializer?.fullName || '',
      new Date(item.createdAt).toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_encuestas_${filters.startDate}_${filters.endDate}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    notificationService.success('Archivo CSV descargado exitosamente')
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
                <h3 className="filter-card__title">⚙️ Filtros de Reporte</h3>
                
                {/* SECCIÓN 1: RANGO DE FECHAS (Obligatorio) */}
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '2px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a7c6f" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <label style={{ fontWeight: '600', color: '#333', fontSize: '0.95rem', margin: 0 }}>
                      Rango de Fechas
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <DateInput
                      label="Desde"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      disabled={isGenerating}
                      required
                    />
                    <DateInput
                      label="Hasta"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      disabled={isGenerating}
                      required
                    />
                  </div>
                </div>

                {/* SECCIÓN 2: BÚSQUEDA Y FILTROS PRINCIPALES */}
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '2px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a7c6f" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <label style={{ fontWeight: '600', color: '#333', fontSize: '0.95rem', margin: 0 }}>
                      Búsqueda y Estado
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <Input
                      label="🔍 Buscar por nombre o ID"
                      value={filters.q}
                      onChange={(e) => handleFilterChange('q', e.target.value)}
                      placeholder="Nombre, identificación..."
                      disabled={isGenerating}
                    />
                    <Select
                      label="📋 Estado de la Encuesta"
                      value={filters.surveyStatus}
                      onChange={(e) => handleFilterChange('surveyStatus', e.target.value as '' | 'successful' | 'unsuccessful')}
                      disabled={isGenerating}
                      options={[
                        { value: '', label: 'Todos' },
                        { value: 'successful', label: '✓ Exitosas' },
                        { value: 'unsuccessful', label: '✗ No Exitosas' },
                      ]}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Select
                      label="✋ Dispuesto a Responder"
                      value={filters.willingToRespond}
                      onChange={(e) => handleFilterChange('willingToRespond', e.target.value as '' | 'true' | 'false')}
                      disabled={isGenerating}
                      options={[
                        { value: '', label: 'Todos' },
                        { value: 'true', label: 'Sí' },
                        { value: 'false', label: 'No' },
                      ]}
                    />
                    <Select
                      label="⭐ Defensor de la Patria"
                      value={filters.isPatriaDefender}
                      onChange={(e) => handleFilterChange('isPatriaDefender', e.target.value as '' | 'true' | 'false')}
                      disabled={isGenerating}
                      options={[
                        { value: '', label: 'Todos' },
                        { value: 'true', label: 'Sí' },
                        { value: 'false', label: 'No' },
                      ]}
                    />
                  </div>
                </div>

                {/* SECCIÓN 3: FILTROS AVANZADOS (Collapsible) */}
                <div style={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  backgroundColor: showAdvancedFilters ? '#f9f9f9' : '#fafafa'
                }}>
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      padding: '0.5rem 0',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: showAdvancedFilters ? '1rem' : 0
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a7c6f" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                        <line x1="4" y1="6" x2="20" y2="6"></line>
                        <line x1="4" y1="12" x2="20" y2="12"></line>
                        <line x1="4" y1="18" x2="20" y2="18"></line>
                      </svg>
                      Filtros Avanzados
                    </span>
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{
                        transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </button>

                  {showAdvancedFilters && (
                    <>
                      {/* Subsección: Demográficos */}
                      <div style={{ marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                          👥 Datos Demográficos
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                          <Select
                            label="Género"
                            value={filters.gender}
                            onChange={(e) => handleFilterChange('gender', e.target.value)}
                            disabled={isGenerating}
                            options={[
                              { value: '', label: 'Todos' },
                              { value: 'Masculino', label: 'Masculino' },
                              { value: 'Femenino', label: 'Femenino' },
                              { value: 'Otro', label: 'Otro' },
                            ]}
                          />
                          <Select
                            label="Rango de Edad"
                            value={filters.ageRange}
                            onChange={(e) => handleFilterChange('ageRange', e.target.value)}
                            disabled={isGenerating}
                            options={[
                              { value: '', label: 'Todos' },
                              { value: '18-24', label: '18-24 años' },
                              { value: '25-34', label: '25-34 años' },
                              { value: '35-44', label: '35-44 años' },
                              { value: '45-54', label: '45-54 años' },
                              { value: '55+', label: '55+ años' },
                            ]}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                          <Select
                            label="Estrato Socioeconómico"
                            value={filters.stratum}
                            onChange={(e) => handleFilterChange('stratum', e.target.value)}
                            disabled={isGenerating}
                            options={[
                              { value: '', label: 'Todos' },
                              { value: '1', label: '1 - Bajo' },
                              { value: '2', label: '2 - Bajo-Medio' },
                              { value: '3', label: '3 - Medio' },
                              { value: '4', label: '4 - Medio-Alto' },
                              { value: '5', label: '5 - Alto' },
                              { value: '6', label: '6 - Muy Alto' },
                            ]}
                          />
                          <Select
                            label="Tipo de Identificación"
                            value={filters.idType}
                            onChange={(e) => handleFilterChange('idType', e.target.value)}
                            disabled={isGenerating}
                            options={[
                              { value: '', label: 'Todos' },
                              { value: 'CC', label: 'Cédula de Ciudadanía' },
                              { value: 'TI', label: 'Tarjeta de Identidad' },
                              { value: 'CE', label: 'Cédula de Extranjería' },
                              { value: 'PA', label: 'Pasaporte' },
                            ]}
                          />
                        </div>
                      </div>

                      {/* Subsección: Ubicación */}
                      <div style={{ paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                          📍 Ubicación
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                          <Input
                            label="Departamento"
                            value={filters.department}
                            onChange={(e) => handleFilterChange('department', e.target.value)}
                            placeholder="ej: Atlántico"
                            disabled={isGenerating}
                          />
                          <Input
                            label="Ciudad"
                            value={filters.city}
                            onChange={(e) => handleFilterChange('city', e.target.value)}
                            placeholder="ej: Barranquilla"
                            disabled={isGenerating}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                          <Input
                            label="Barrio"
                            value={filters.neighborhood}
                            onChange={(e) => handleFilterChange('neighborhood', e.target.value)}
                            placeholder="ej: Centro Histórico"
                            disabled={isGenerating}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="filter-card__actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn--primary"
                    onClick={() => generateReport(1)}
                    disabled={isGenerating || !filters.startDate || !filters.endDate}
                    style={{ flex: '1', minWidth: '150px' }}
                  >
                    {isGenerating ? (
                      <>
                        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}>⚙️</span>
                        Generando...
                      </>
                    ) : (
                      <>📊 Generar Reporte</>
                    )}
                  </button>
                  
                  <button
                    className="btn btn--secondary"
                    onClick={exportToCSV}
                    disabled={isGenerating || reportData.length === 0}
                    style={{ flex: '1', minWidth: '150px' }}
                  >
                    📥 Exportar CSV
                  </button>

                  <button
                    className="btn btn--secondary"
                    onClick={() => {
                      setFilters({
                        startDate: '',
                        endDate: '',
                        q: '',
                        surveyStatus: '',
                        willingToRespond: '',
                        isPatriaDefender: '',
                        department: '',
                        city: '',
                        region: '',
                        neighborhood: '',
                        gender: '',
                        ageRange: '',
                        stratum: '',
                        idType: '',
                        sortBy: '',
                        sortOrder: 'asc',
                      })
                      setCurrentPage(1)
                      setReportResponse(null)
                      setReportData([])
                    }}
                    disabled={isGenerating}
                    style={{ minWidth: '120px' }}
                  >
                    🔄 Limpiar
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
                  Seleccione un rango de fechas y haga clic en "Generar Reporte" para visualizar los datos con los filtros aplicados.
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
                      {reportResponse.data.totalItems} {reportResponse.data.totalItems === 1 ? 'registro' : 'registros'}
                    </span>
                    <span className="results-header__count">
                      Página {reportResponse.data.currentPage} de {reportResponse.data.totalPages}
                    </span>
                    <span className="results-header__date-range">
                      {filters.startDate} - {filters.endDate}
                    </span>
                  </div>
                </div>

                <div className="reports-table-container" style={{ marginTop: '1.5rem', overflow: 'auto' }}>
                  <table className="survey-table" style={{ width: '100%', minWidth: '1200px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f3f5', position: 'sticky', top: 0 }}>
                        <th className="survey-table__th" style={{ textAlign: 'left', minWidth: '50px' }}>#</th>
                        <th className="survey-table__th" style={{ textAlign: 'left', minWidth: '150px' }}>Nombre</th>
                        <th className="survey-table__th" style={{ textAlign: 'left', minWidth: '120px' }}>Identificación</th>
                        <th className="survey-table__th" style={{ textAlign: 'left', minWidth: '100px' }}>Género</th>
                        <th className="survey-table__th" style={{ textAlign: 'left', minWidth: '100px' }}>Edad</th>
                        <th className="survey-table__th" style={{ textAlign: 'left', minWidth: '80px' }}>Estrato</th>
                        <th className="survey-table__th" style={{ textAlign: 'left', minWidth: '150px' }}>Ubicación</th>
                        <th className="survey-table__th" style={{ textAlign: 'center', minWidth: '100px' }}>Estado</th>
                        <th className="survey-table__th" style={{ textAlign: 'center', minWidth: '100px' }}>Respuesta</th>
                        <th className="survey-table__th" style={{ textAlign: 'center', minWidth: '80px' }}>Defensor</th>
                        <th className="survey-table__th" style={{ textAlign: 'left', minWidth: '130px' }}>Socializador</th>
                        <th className="survey-table__th" style={{ textAlign: 'left', minWidth: '150px' }}>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((item, idx) => (
                        <tr key={item._id} style={{ borderBottom: '1px solid #e9ecef' }}>
                          <td className="survey-table__td" style={{ textAlign: 'left', fontWeight: 'bold', color: '#666' }}>
                            {idx + 1}
                          </td>
                          <td className="survey-table__td" style={{ textAlign: 'left', fontWeight: '500' }}>
                            {item.fullName}
                          </td>
                          <td className="survey-table__td" style={{ textAlign: 'left', fontSize: '0.85rem' }}>
                            {item.identification || '-'}
                          </td>
                          <td className="survey-table__td" style={{ textAlign: 'left', fontSize: '0.85rem' }}>
                            {item.gender || '-'}
                          </td>
                          <td className="survey-table__td" style={{ textAlign: 'left', fontSize: '0.85rem' }}>
                            {item.ageRange || '-'}
                          </td>
                          <td className="survey-table__td" style={{ textAlign: 'left', fontSize: '0.85rem' }}>
                            {item.stratum ? item.stratum.toString() : '-'}
                          </td>
                          <td className="survey-table__td" style={{ textAlign: 'left', fontSize: '0.8rem', color: '#555' }}>
                            <div>{item.city || item.department || 'N/A'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#999' }}>{item.region}</div>
                          </td>
                          <td className="survey-table__td" style={{ textAlign: 'center' }}>
                            <span style={{
                              padding: '0.35rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              backgroundColor: item.surveyStatus === 'successful' ? '#d4edda' : '#f8d7da',
                              color: item.surveyStatus === 'successful' ? '#155724' : '#721c24',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.surveyStatus === 'successful' ? '✓ Exitosa' : '✗ No Exitosa'}
                            </span>
                          </td>
                          <td className="survey-table__td" style={{ textAlign: 'center' }}>
                            <span style={{
                              padding: '0.35rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              backgroundColor: item.willingToRespond ? '#d4edda' : '#f8d7da',
                              color: item.willingToRespond ? '#155724' : '#721c24',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.willingToRespond ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td className="survey-table__td" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: item.isPatriaDefender ? '#0066cc' : '#999' }}>
                              {item.isPatriaDefender ? '★ Sí' : '-'}
                            </span>
                          </td>
                          <td className="survey-table__td" style={{ textAlign: 'left', fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: '500' }}>{item.socializer?.fullName || 'N/A'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#999' }}>{item.socializer?.idNumber}</div>
                          </td>
                          <td className="survey-table__td" style={{ textAlign: 'left', fontSize: '0.8rem', color: '#666' }}>
                            {new Date(item.createdAt).toLocaleString('es-CO', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* CONTROLES DE PAGINACIÓN */}
                <div style={{
                  marginTop: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  padding: '1.5rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isGenerating}
                    style={{
                      padding: '0.6rem 1.2rem',
                      backgroundColor: currentPage === 1 ? '#e9ecef' : '#4a7c6f',
                      color: currentPage === 1 ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    ← Anterior
                  </button>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1rem',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6',
                    minWidth: '150px',
                    justifyContent: 'center',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '0.95rem'
                  }}>
                    <span>Página {currentPage} de {reportResponse.data.totalPages}</span>
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === reportResponse.data.totalPages || isGenerating}
                    style={{
                      padding: '0.6rem 1.2rem',
                      backgroundColor: currentPage === reportResponse.data.totalPages ? '#e9ecef' : '#4a7c6f',
                      color: currentPage === reportResponse.data.totalPages ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: currentPage === reportResponse.data.totalPages ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Siguiente →
                  </button>

                  <div style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    padding: '0 0.5rem',
                    borderLeft: '1px solid #dee2e6',
                    marginLeft: '0.5rem',
                    paddingLeft: '1rem'
                  }}>
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, reportResponse.data.totalItems)} de {reportResponse.data.totalItems}
                  </div>
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
                  No se encontraron resultados
                </h2>
                <p className="empty-state__description">
                  Intente ajustar los filtros y genere un nuevo reporte.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
