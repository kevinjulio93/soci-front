#!/usr/bin/env python3
"""Write the ReportsGenerate.tsx file cleanly."""

import os

TARGET = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "src", "pages", "ReportsGenerate.tsx"
)

CONTENT = r'''/**
 * ReportsGenerate - Generar reportes tabulares
 * Layout: Tabla principal a la izquierda, panel de filtros colapsable a la derecha
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
  location: { type: 'Point'; coordinates: [number, number] }
  autor: { _id: string; email: string; role: string }
  createdAt: string
  updatedAt: string
  audioFileKey?: string
  socializer: { _id: string; fullName: string; idNumber: string; phone: string }
  rejectionReason?: { value: string; label: string }
  noResponseReason?: { value: string; label: string }
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

const TABLE_COLUMNS = [
  { key: '#', label: '#', minWidth: '50px', align: 'left' as const },
  { key: 'name', label: 'Nombre', minWidth: '150px', align: 'left' as const },
  { key: 'id', label: 'Identificaci\u00f3n', minWidth: '120px', align: 'left' as const },
  { key: 'gender', label: 'G\u00e9nero', minWidth: '100px', align: 'left' as const },
  { key: 'age', label: 'Edad', minWidth: '100px', align: 'left' as const },
  { key: 'stratum', label: 'Estrato', minWidth: '80px', align: 'left' as const },
  { key: 'location', label: 'Ubicaci\u00f3n', minWidth: '150px', align: 'left' as const },
  { key: 'status', label: 'Estado', minWidth: '100px', align: 'center' as const },
  { key: 'response', label: 'Respuesta', minWidth: '100px', align: 'center' as const },
  { key: 'defender', label: 'Defensor', minWidth: '80px', align: 'center' as const },
  { key: 'socializer', label: 'Socializador', minWidth: '130px', align: 'left' as const },
  { key: 'date', label: 'Fecha', minWidth: '150px', align: 'left' as const },
]

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
  const [filterPanelOpen, setFilterPanelOpen] = useState(true)
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
    // No initial data load needed
  }, [])

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleBackToReports = () => navigate(ROUTES.ADMIN_REPORTS)

  const generateReport = async (page: number = 1) => {
    if (!filters.startDate || !filters.endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      setError('Por favor seleccione un rango de fechas')
      return
    }
    try {
      setIsGenerating(true)
      setError(null)
      const dashboardParams = {
        page,
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
      notificationService.success(`Reporte generado: ${response.data.totalItems} registros`)
    } catch (err) {
      notificationService.handleApiError(err, 'Error al generar el reporte')
      setError('Error al generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePageChange = (page: number) => generateReport(page)

  const exportToCSV = () => {
    if (reportData.length === 0) {
      notificationService.warning('No hay datos para exportar')
      return
    }
    const headers = [
      'N\u00b0', 'Nombre Completo', 'Identificaci\u00f3n', 'Email', 'Tel\u00e9fono',
      'G\u00e9nero', 'Edad', 'Estrato', 'Departamento', 'Ciudad', 'Regi\u00f3n',
      'Barrio', 'Defensor Patria', 'Estado Encuesta', 'Dispuesto Responder',
      'Socializer', 'Fecha Creaci\u00f3n',
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
      item.isPatriaDefender ? 'S\u00ed' : 'No',
      item.surveyStatus === 'successful' ? 'Exitosa' : 'No Exitosa',
      item.willingToRespond ? 'S\u00ed' : 'No',
      item.socializer?.fullName || '',
      new Date(item.createdAt).toLocaleString('es-CO', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }),
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `reporte_encuestas_${filters.startDate}_${filters.endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    notificationService.success('Archivo CSV descargado exitosamente')
  }

  const clearFilters = () => {
    setFilters({
      startDate: '', endDate: '', q: '', surveyStatus: '',
      willingToRespond: '', isPatriaDefender: '', department: '',
      city: '', region: '', neighborhood: '', gender: '',
      ageRange: '', stratum: '', idType: '', sortBy: '', sortOrder: 'asc',
    })
    setCurrentPage(1)
    setReportResponse(null)
    setReportData([])
  }

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value && key !== 'sortOrder'
  ).length

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

          <div className="rg-layout">
            {/* ====== MAIN CONTENT: Tabla (lado izquierdo) ====== */}
            <div className="rg-layout__main">
              {/* Header con info y acciones */}
              <div className="rg-main-header">
                <div className="rg-main-header__left">
                  <h3 className="rg-main-header__title">
                    {reportData.length > 0 && reportResponse
                      ? 'Resultados del Reporte'
                      : 'Reporte Tabular'}
                  </h3>
                  {reportData.length > 0 && reportResponse && (
                    <div className="rg-main-header__info">
                      <span className="rg-badge rg-badge--count">
                        {reportResponse.data.totalItems}{' '}
                        {reportResponse.data.totalItems === 1 ? 'registro' : 'registros'}
                      </span>
                      <span className="rg-badge rg-badge--page">
                        P\u00e1g. {reportResponse.data.currentPage}/{reportResponse.data.totalPages}
                      </span>
                      {filters.startDate && filters.endDate && (
                        <span className="rg-badge rg-badge--date">
                          {filters.startDate} &rarr; {filters.endDate}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="rg-main-header__right">
                  {reportData.length > 0 && (
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={exportToCSV}
                      disabled={isGenerating}
                      title="Exportar a CSV"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.4rem' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Exportar CSV
                    </button>
                  )}
                  <button
                    className={`rg-filter-toggle ${filterPanelOpen ? 'rg-filter-toggle--active' : ''}`}
                    onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                    title={filterPanelOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    {activeFiltersCount > 0 && (
                      <span className="rg-filter-toggle__badge">{activeFiltersCount}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Loading state */}
              {isGenerating && (
                <div className="rg-loading">
                  <div className="rg-loading__spinner" />
                  <p className="rg-loading__text">Generando reporte...</p>
                </div>
              )}

              {/* Tabla con datos o tabla vac\u00eda */}
              {!isGenerating && (
                <div className="rg-table-container">
                  <table className="rg-table">
                    <thead>
                      <tr>
                        {TABLE_COLUMNS.map(col => (
                          <th
                            key={col.key}
                            className="rg-table__th"
                            style={{ textAlign: col.align, minWidth: col.minWidth }}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.length > 0 ? (
                        reportData.map((item, idx) => (
                          <tr key={item._id} className="rg-table__row">
                            <td className="rg-table__td" style={{ fontWeight: 'bold', color: '#666' }}>
                              {((currentPage - 1) * itemsPerPage) + idx + 1}
                            </td>
                            <td className="rg-table__td" style={{ fontWeight: '500' }}>
                              {item.fullName}
                            </td>
                            <td className="rg-table__td rg-table__td--small">
                              {item.identification || '-'}
                            </td>
                            <td className="rg-table__td rg-table__td--small">
                              {item.gender || '-'}
                            </td>
                            <td className="rg-table__td rg-table__td--small">
                              {item.ageRange || '-'}
                            </td>
                            <td className="rg-table__td rg-table__td--small">
                              {item.stratum ? item.stratum.toString() : '-'}
                            </td>
                            <td className="rg-table__td rg-table__td--small" style={{ color: '#555' }}>
                              <div>{item.city || item.department || 'N/A'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#999' }}>{item.region}</div>
                            </td>
                            <td className="rg-table__td" style={{ textAlign: 'center' }}>
                              <span
                                className={`rg-status-badge ${
                                  item.surveyStatus === 'successful'
                                    ? 'rg-status-badge--success'
                                    : 'rg-status-badge--error'
                                }`}
                              >
                                {item.surveyStatus === 'successful' ? '\u2713 Exitosa' : '\u2717 No Exitosa'}
                              </span>
                            </td>
                            <td className="rg-table__td" style={{ textAlign: 'center' }}>
                              <span
                                className={`rg-status-badge ${
                                  item.willingToRespond
                                    ? 'rg-status-badge--success'
                                    : 'rg-status-badge--error'
                                }`}
                              >
                                {item.willingToRespond ? 'S\u00ed' : 'No'}
                              </span>
                            </td>
                            <td className="rg-table__td" style={{ textAlign: 'center' }}>
                              <span style={{ color: item.isPatriaDefender ? '#0066cc' : '#999' }}>
                                {item.isPatriaDefender ? '\u2605 S\u00ed' : '-'}
                              </span>
                            </td>
                            <td className="rg-table__td" style={{ fontSize: '0.8rem' }}>
                              <div style={{ fontWeight: '500' }}>{item.socializer?.fullName || 'N/A'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#999' }}>{item.socializer?.idNumber}</div>
                            </td>
                            <td className="rg-table__td" style={{ fontSize: '0.8rem', color: '#666' }}>
                              {new Date(item.createdAt).toLocaleString('es-CO', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={TABLE_COLUMNS.length} className="rg-table__empty">
                            <div className="rg-empty">
                              <svg className="rg-empty__icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <h4 className="rg-empty__title">Sin datos para mostrar</h4>
                              <p className="rg-empty__text">
                                Configure los filtros en el panel lateral y haga clic en{' '}
                                <strong>&quot;Generar Reporte&quot;</strong> para visualizar los resultados.
                              </p>
                              {!filterPanelOpen && (
                                <button
                                  className="btn btn--primary btn--sm"
                                  onClick={() => setFilterPanelOpen(true)}
                                  style={{ marginTop: '1rem' }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.4rem' }}>
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                  </svg>
                                  Abrir Filtros
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginaci\u00f3n */}
              {reportData.length > 0 && reportResponse && (
                <div className="rg-pagination">
                  <button
                    className="rg-pagination__btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isGenerating}
                  >
                    &larr; Anterior
                  </button>
                  <span className="rg-pagination__info">
                    P\u00e1gina {currentPage} de {reportResponse.data.totalPages}
                  </span>
                  <button
                    className="rg-pagination__btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === reportResponse.data.totalPages || isGenerating}
                  >
                    Siguiente &rarr;
                  </button>
                  <span className="rg-pagination__detail">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1}-
                    {Math.min(currentPage * itemsPerPage, reportResponse.data.totalItems)}{' '}
                    de {reportResponse.data.totalItems}
                  </span>
                </div>
              )}
            </div>

            {/* ====== FILTER PANEL: Panel de filtros (lado derecho) ====== */}
            <div className={`rg-layout__filters ${filterPanelOpen ? 'rg-layout__filters--open' : ''}`}>
              <div className="rg-filters">
                {/* Header del panel */}
                <div className="rg-filters__header">
                  <h3 className="rg-filters__title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    Filtros
                  </h3>
                  <button
                    className="rg-filters__close"
                    onClick={() => setFilterPanelOpen(false)}
                    title="Cerrar panel de filtros"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Contenido de filtros con scroll */}
                <div className="rg-filters__body">
                  {/* SECCI\u00d3N 1: RANGO DE FECHAS */}
                  <div className="rg-filters__section">
                    <div className="rg-filters__section-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7c6f" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Rango de Fechas <span className="rg-filters__required">*</span>
                    </div>
                    <div className="rg-filters__grid">
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

                  {/* SECCI\u00d3N 2: B\u00daSQUEDA Y ESTADO */}
                  <div className="rg-filters__section">
                    <div className="rg-filters__section-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7c6f" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      B\u00fasqueda y Estado
                    </div>
                    <Input
                      label="Buscar por nombre o ID"
                      value={filters.q}
                      onChange={(e) => handleFilterChange('q', e.target.value)}
                      placeholder="Nombre, identificaci\u00f3n..."
                      disabled={isGenerating}
                    />
                    <Select
                      label="Estado de la Encuesta"
                      value={filters.surveyStatus}
                      onChange={(e) => handleFilterChange('surveyStatus', e.target.value as '' | 'successful' | 'unsuccessful')}
                      disabled={isGenerating}
                      options={[
                        { value: '', label: 'Todos' },
                        { value: 'successful', label: '\u2713 Exitosas' },
                        { value: 'unsuccessful', label: '\u2717 No Exitosas' },
                      ]}
                    />
                    <Select
                      label="Dispuesto a Responder"
                      value={filters.willingToRespond}
                      onChange={(e) => handleFilterChange('willingToRespond', e.target.value as '' | 'true' | 'false')}
                      disabled={isGenerating}
                      options={[
                        { value: '', label: 'Todos' },
                        { value: 'true', label: 'S\u00ed' },
                        { value: 'false', label: 'No' },
                      ]}
                    />
                    <Select
                      label="Defensor de la Patria"
                      value={filters.isPatriaDefender}
                      onChange={(e) => handleFilterChange('isPatriaDefender', e.target.value as '' | 'true' | 'false')}
                      disabled={isGenerating}
                      options={[
                        { value: '', label: 'Todos' },
                        { value: 'true', label: 'S\u00ed' },
                        { value: 'false', label: 'No' },
                      ]}
                    />
                  </div>

                  {/* SECCI\u00d3N 3: FILTROS AVANZADOS */}
                  <div className="rg-filters__section rg-filters__section--advanced">
                    <button
                      className="rg-filters__advanced-toggle"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                      <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7c6f" strokeWidth="2">
                          <line x1="4" y1="6" x2="20" y2="6" />
                          <line x1="4" y1="12" x2="20" y2="12" />
                          <line x1="4" y1="18" x2="20" y2="18" />
                        </svg>
                        Filtros Avanzados
                      </span>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        style={{
                          transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform 0.3s',
                        }}
                      >
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>

                    {showAdvancedFilters && (
                      <div className="rg-filters__advanced-content">
                        <div className="rg-filters__subsection">
                          <h4 className="rg-filters__subsection-title">Demogr\u00e1ficos</h4>
                          <Select
                            label="G\u00e9nero"
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
                              { value: '18-24', label: '18-24 a\u00f1os' },
                              { value: '25-34', label: '25-34 a\u00f1os' },
                              { value: '35-44', label: '35-44 a\u00f1os' },
                              { value: '45-54', label: '45-54 a\u00f1os' },
                              { value: '55+', label: '55+ a\u00f1os' },
                            ]}
                          />
                          <Select
                            label="Estrato Socioecon\u00f3mico"
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
                            label="Tipo de Identificaci\u00f3n"
                            value={filters.idType}
                            onChange={(e) => handleFilterChange('idType', e.target.value)}
                            disabled={isGenerating}
                            options={[
                              { value: '', label: 'Todos' },
                              { value: 'CC', label: 'C\u00e9dula de Ciudadan\u00eda' },
                              { value: 'TI', label: 'Tarjeta de Identidad' },
                              { value: 'CE', label: 'C\u00e9dula de Extranjer\u00eda' },
                              { value: 'PA', label: 'Pasaporte' },
                            ]}
                          />
                        </div>

                        <div className="rg-filters__subsection">
                          <h4 className="rg-filters__subsection-title">Ubicaci\u00f3n</h4>
                          <Input
                            label="Departamento"
                            value={filters.department}
                            onChange={(e) => handleFilterChange('department', e.target.value)}
                            placeholder="ej: Atl\u00e1ntico"
                            disabled={isGenerating}
                          />
                          <Input
                            label="Ciudad"
                            value={filters.city}
                            onChange={(e) => handleFilterChange('city', e.target.value)}
                            placeholder="ej: Barranquilla"
                            disabled={isGenerating}
                          />
                          <Input
                            label="Barrio"
                            value={filters.neighborhood}
                            onChange={(e) => handleFilterChange('neighborhood', e.target.value)}
                            placeholder="ej: Centro Hist\u00f3rico"
                            disabled={isGenerating}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer con botones de acci\u00f3n */}
                <div className="rg-filters__footer">
                  <button
                    className="btn btn--primary"
                    onClick={() => generateReport(1)}
                    disabled={isGenerating || !filters.startDate || !filters.endDate}
                    style={{ width: '100%' }}
                  >
                    {isGenerating ? (
                      <>
                        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}>
                          &#9881;&#65039;
                        </span>
                        Generando...
                      </>
                    ) : (
                      <>&#128202; Generar Reporte</>
                    )}
                  </button>
                  <button
                    className="btn btn--secondary"
                    onClick={clearFilters}
                    disabled={isGenerating}
                    style={{ width: '100%' }}
                  >
                    &#128260; Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'''

with open(TARGET, 'w', encoding='utf-8') as f:
    f.write(CONTENT.lstrip('\n'))

print(f"Successfully wrote {TARGET}")
print(f"File size: {os.path.getsize(TARGET)} bytes")
