/**
 * ReportsGenerate - Generar reportes tabulares
 * Layout: Tabla principal a la izquierda, panel de filtros colapsable a la derecha
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components'
import { ReportFilterPanel, INITIAL_FILTERS } from '../components/ReportFilterPanel'
import { ReportTable } from '../components/ReportTable'
import type { ReportFilters } from '../components/ReportFilterPanel'
import type { ReportTableColumn } from '../components/ReportTable'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { ROUTES } from '../constants'
import '../styles/Dashboard.scss'

// Tipo local para items del reporte (mapeado de Dashboard002Survey)
interface ReportItem {
  _id: string
  willingToRespond: boolean
  surveyStatus: 'successful' | 'unsuccessful'
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

// Configuración de columnas
const TABLE_COLUMNS: ReportTableColumn<ReportItem>[] = [
  {
    key: '#',
    label: '#',
    minWidth: '50px',
    render: (_item, idx) => (
      <span style={{ fontWeight: 'bold', color: '#666' }}>{idx + 1}</span>
    ),
  },
  {
    key: 'name',
    label: 'Nombre',
    minWidth: '150px',
    render: (item) => (
      <span style={{ fontWeight: 500 }}>{item.fullName}</span>
    ),
  },
  {
    key: 'id',
    label: 'Identificación',
    minWidth: '120px',
    render: (item) => (
      <span className="rg-table__td--small">{item.identification || '—'}</span>
    ),
  },
  {
    key: 'gender',
    label: 'Género',
    minWidth: '100px',
    render: (item) => (
      <span className="rg-table__td--small">{item.gender || '—'}</span>
    ),
  },
  {
    key: 'age',
    label: 'Edad',
    minWidth: '100px',
    render: (item) => (
      <span className="rg-table__td--small">{item.ageRange || '—'}</span>
    ),
  },
  {
    key: 'stratum',
    label: 'Estrato',
    minWidth: '80px',
    render: (item) => (
      <span className="rg-table__td--small">{item.stratum?.toString() || '—'}</span>
    ),
  },
  {
    key: 'location',
    label: 'Ubicación',
    minWidth: '150px',
    render: (item) => (
      <div>
        <div className="rg-table__td--small" style={{ color: '#555' }}>
          {item.city || item.department || 'N/A'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#999' }}>{item.region}</div>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Estado',
    minWidth: '100px',
    align: 'center',
    render: (item) => (
      <span
        className={`rg-status-badge ${
          item.surveyStatus === 'successful'
            ? 'rg-status-badge--success'
            : 'rg-status-badge--error'
        }`}
      >
        {item.surveyStatus === 'successful' ? '✓ Exitosa' : '✗ No Exitosa'}
      </span>
    ),
  },
  {
    key: 'response',
    label: 'Respuesta',
    minWidth: '100px',
    align: 'center',
    render: (item) => (
      <span
        className={`rg-status-badge ${
          item.willingToRespond
            ? 'rg-status-badge--success'
            : 'rg-status-badge--error'
        }`}
      >
        {item.willingToRespond ? 'Sí' : 'No'}
      </span>
    ),
  },
  {
    key: 'defender',
    label: 'Defensor',
    minWidth: '80px',
    align: 'center',
    render: (item) => (
      <span style={{ color: item.isPatriaDefender ? '#0066cc' : '#999' }}>
        {item.isPatriaDefender ? '★ Sí' : '—'}
      </span>
    ),
  },
  {
    key: 'socializer',
    label: 'Socializador',
    minWidth: '130px',
    render: (item) => (
      <div>
        <div style={{ fontWeight: 500, fontSize: '0.8rem' }}>
          {item.socializer?.fullName || 'N/A'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#999' }}>
          {item.socializer?.idNumber}
        </div>
      </div>
    ),
  },
  {
    key: 'date',
    label: 'Fecha',
    minWidth: '150px',
    render: (item) => (
      <span style={{ fontSize: '0.8rem', color: '#666' }}>
        {new Date(item.createdAt).toLocaleString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    ),
  },
]

export default function ReportsGenerate() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [filterPanelOpen, setFilterPanelOpen] = useState(true)
  const [filters, setFilters] = useState<ReportFilters>(INITIAL_FILTERS)
  const [reportData, setReportData] = useState<ReportItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // ---- Handlers ----
  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleBackToReports = () => navigate(ROUTES.ADMIN_REPORTS)

  const generateReport = async (page: number = 1) => {
    if (!filters.startDate || !filters.endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }
    try {
      setIsGenerating(true)
      const params = {
        page,
        perPage: itemsPerPage,
        startDate: filters.startDate,
        endDate: filters.endDate,
        q: filters.q || undefined,
        surveyStatus: filters.surveyStatus || undefined,
        willingToRespond: filters.willingToRespond
          ? filters.willingToRespond === 'true'
          : undefined,
        isPatriaDefender: filters.isPatriaDefender
          ? filters.isPatriaDefender === 'true'
          : undefined,
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
      const response = await apiService.getDashboard002Report(params)
      setReportData(response.data.surveys || [])
      setCurrentPage(response.data.currentPage)
      setTotalItems(response.data.totalItems)
      setTotalPages(response.data.totalPages)
      notificationService.success(
        `Reporte generado: ${response.data.totalItems} registros`
      )
    } catch (err) {
      notificationService.handleApiError(err, 'Error al generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePageChange = (page: number) => generateReport(page)

  const exportToExcel = async () => {
    if (!filters.startDate || !filters.endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }
    try {
      await apiService.exportDashboard002({
        startDate: filters.startDate,
        endDate: filters.endDate,
        q: filters.q || undefined,
        surveyStatus: (filters.surveyStatus as 'successful' | 'unsuccessful') || undefined,
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
        sortOrder: (filters.sortOrder as 'asc' | 'desc') || undefined,
      })
      notificationService.success('Archivo Excel descargado exitosamente')
    } catch (err) {
      notificationService.handleApiError(err, 'Error al exportar el reporte')
    }
  }

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS)
    setCurrentPage(1)
    setTotalItems(0)
    setTotalPages(0)
    setReportData([])
  }

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value && key !== 'sortOrder'
  ).length

  const hasData = reportData.length > 0

  // Render columns with adjusted index for pagination
  const paginatedColumns: ReportTableColumn<ReportItem>[] = TABLE_COLUMNS.map(
    (col) => {
      if (col.key === '#') {
        return {
          ...col,
          render: (_item: ReportItem, idx: number) => (
            <span style={{ fontWeight: 'bold', color: '#666' }}>
              {(currentPage - 1) * itemsPerPage + idx + 1}
            </span>
          ),
        }
      }
      return col
    }
  )

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-layout__content">
        {/* Page header */}
        <div className="dashboard-layout__header">
          <button
            className="dashboard-layout__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <button className="btn-back" onClick={handleBackToReports}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="dashboard-layout__title">
            Reportes - Generar Reporte Tabular
          </h1>
        </div>

        <div className="dashboard-layout__body">
          <div className="rg-layout">
            {/* ====== MAIN: Tabla / Empty State (izquierda) ====== */}
            <div className="rg-layout__main">
              {/* Header barra superior */}
              <div className="rg-main-header">
                <div className="rg-main-header__left">
                  <h3 className="rg-main-header__title">
                    {hasData ? 'Resultados del Reporte' : 'Reporte de Encuestas'}
                  </h3>
                  {hasData && (
                    <div className="rg-main-header__info">
                      <span className="rg-badge rg-badge--count">
                        {totalItems}{' '}
                        {totalItems === 1 ? 'registro' : 'registros'}
                      </span>
                      <span className="rg-badge rg-badge--page">
                        Pág. {currentPage}/{totalPages}
                      </span>
                      {filters.startDate && filters.endDate && (
                        <span className="rg-badge rg-badge--date">
                          {filters.startDate} → {filters.endDate}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="rg-main-header__right">
                  {hasData && (
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={exportToExcel}
                      disabled={isGenerating}
                      title="Exportar a Excel"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ marginRight: '0.4rem' }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                        />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Exportar Excel
                    </button>
                  )}
                  <button
                    className={`rg-filter-toggle ${filterPanelOpen ? 'rg-filter-toggle--active' : ''}`}
                    onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                    title={
                      filterPanelOpen ? 'Ocultar filtros' : 'Mostrar filtros'
                    }
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    <span className="rg-filter-toggle__label">
                      {filterPanelOpen ? 'Ocultar' : 'Filtros'}
                    </span>
                    {activeFiltersCount > 0 && (
                      <span className="rg-filter-toggle__badge">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tabla o empty state */}
              <div className="rg-table-container">
                <ReportTable<ReportItem>
                  columns={paginatedColumns}
                  data={reportData}
                  getRowKey={(item) => item._id}
                  isLoading={isGenerating}
                  emptyTitle="Configure sus filtros"
                  emptyDescription='Seleccione un rango de fechas y haga clic en "Generar Reporte" para visualizar los resultados.'
                  emptyAction={
                    !filterPanelOpen
                      ? {
                          label: 'Abrir Filtros',
                          onClick: () => setFilterPanelOpen(true),
                          icon: (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{ marginRight: '0.4rem' }}
                            >
                              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                          ),
                        }
                      : undefined
                  }
                />
              </div>

              {/* Paginación */}
              {hasData && (
                <div className="rg-pagination">
                  <button
                    className="rg-pagination__btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isGenerating}
                  >
                    ← Anterior
                  </button>
                  <span className="rg-pagination__info">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    className="rg-pagination__btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isGenerating}
                  >
                    Siguiente →
                  </button>
                  <span className="rg-pagination__detail">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, totalItems)} de{' '}
                    {totalItems}
                  </span>
                </div>
              )}
            </div>

            {/* ====== FILTROS: Panel lateral derecho ====== */}
            <div
              className={`rg-layout__filters ${filterPanelOpen ? 'rg-layout__filters--open' : ''}`}
            >
              <ReportFilterPanel
                isOpen={filterPanelOpen}
                onClose={() => setFilterPanelOpen(false)}
                filters={filters}
                onFilterChange={handleFilterChange}
                onGenerate={() => generateReport(1)}
                onExportCSV={exportToExcel}
                onClear={clearFilters}
                isGenerating={isGenerating}
                hasData={hasData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
