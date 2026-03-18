/**
 * ReportsSocializers - Reporte por Rol
 * Muestra intervenciones, exitosas, no exitosas y defensores agrupados por usuario del rol seleccionado
 */

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout, Select, SearchableSelect, ToggleUnsuccessful, ChartIcon, CheckIcon, StarIcon, HomeIcon, PlusIcon, WifiIcon, XIcon, StatCard, DateRangeFilter, StatsGrid, VerifiedIcon, ExcelIcon } from '../components'
import { ReportTable } from '../components/ReportTable'
import { useUnsuccessfulToggle } from '../hooks/useUnsuccessfulToggle'
import { useAuth } from '../contexts/AuthContext'
import type { ReportTableColumn } from '../components/ReportTable'
import { apiService, type ZoneDepartmentEntry, type ZoneMunicipalityItem } from '../services/api.service'
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [startDate, setStartDate] = useState(getTodayString())
  const [endDate, setEndDate] = useState(getTodayString())
  const [selectedRole, setSelectedRole] = useState('socializer')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedMunicipality, setSelectedMunicipality] = useState('')
  const [zoneDepartments, setZoneDepartments] = useState<ZoneDepartmentEntry[]>([])
  const [municipalities, setMunicipalities] = useState<ZoneMunicipalityItem[]>([])
  const [loadingDepts, setLoadingDepts] = useState(false)
  const [reportData, setReportData] = useState<SocializerRow[]>([])
  const [summaryData, setSummaryData] = useState<any>(null)
  const [reportSummaryLabel, setReportSummaryLabel] = useState('')

  const { showUnsuccessful } = useUnsuccessfulToggle()

  const userRole = user?.role?.role?.toLowerCase() || ''

  const ACTIVE_ZONE = import.meta.env.VITE_ACTIVE_ZONE || 'zona1'
  const ZONE_ALIASES: Record<string, number> = { zonaf: 6 }
  const ZONE_NUMBER = ZONE_ALIASES[ACTIVE_ZONE] ?? (parseInt(ACTIVE_ZONE.replace('zona', ''), 10) || 1)

  // Cargar departamentos y municipios de la zona activa
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepts(true)
      try {
        const response = await apiService.getZoneDepartments(ZONE_NUMBER)
        setZoneDepartments(response.departments)
      } catch {
        setZoneDepartments([])
      } finally {
        setLoadingDepts(false)
      }
    }
    loadDepartments()
  }, [])

  // Actualizar municipios cuando cambia el departamento seleccionado
  useEffect(() => {
    if (!selectedDepartment) {
      setMunicipalities([])
      return
    }

    const selectedDept = zoneDepartments.find(d => d?.department?._id === selectedDepartment)
    if (selectedDept?.municipalities) {
      setMunicipalities(selectedDept.municipalities)
    } else {
      setMunicipalities([])
    }
  }, [selectedDepartment, zoneDepartments])

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value)
    setSelectedMunicipality('')
  }

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

  // Optimización: Memoizar las columnas de la tabla para evitar re-renders innecesarios en DataTable
  // Basado en la regla: rerender-memo
  const memoizedColumns = useMemo(() => {
    return showUnsuccessful
      ? TABLE_COLUMNS
      : TABLE_COLUMNS.filter(c => c.key !== 'unsuccessful')
  }, [showUnsuccessful])

  const handleBackToReports = () => navigate(ROUTES.ADMIN_REPORTS)



  const generateReport = async () => {
    if (!startDate || !endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }
    try {
      setIsGenerating(true)

      const params: { fecha_inicio: string; fecha_fin: string; rol?: string; departamentoId?: string; municipioId?: string } = {
        fecha_inicio: startDate,
        fecha_fin: endDate,
      }
      if (selectedRole) {
        params.rol = selectedRole
      }
      if (selectedDepartment) {
        params.departamentoId = selectedDepartment
      }
      if (selectedMunicipality) {
        params.municipioId = selectedMunicipality
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
      const totalIntervenciones = response.resumen?.totalEncuestas ?? rows.reduce((s, r) => s + r.interventions, 0)
      const summaryText = `Reporte generado: ${rows.length} ${rolLabel.toLowerCase()}, ${totalIntervenciones} intervenciones`
      setReportSummaryLabel(summaryText)
      notificationService.success(summaryText)
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
      const params: { fecha_inicio: string; fecha_fin: string; rol?: string; departamentoId?: string; municipioId?: string } = {
        fecha_inicio: startDate,
        fecha_fin: endDate,
      }
      if (selectedRole) {
        params.rol = selectedRole
      }
      if (selectedDepartment) {
        params.departamentoId = selectedDepartment
      }
      if (selectedMunicipality) {
        params.municipioId = selectedMunicipality
      }
      await apiService.exportDashboard003(params)
      notificationService.success('Archivo Excel descargado exitosamente')
    } catch (err) {
      notificationService.handleApiError(err, 'Error al exportar el reporte')
    }
  }

  // Totales - Memoizado para evitar el cálculo en cada render si no hay cambios en la data
  const totals = useMemo(() => {
    return reportData.reduce(
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
  }, [reportData])

  const hasData = reportData.length > 0

  return (
    <DashboardLayout
      title="Reportes - Reporte por Rol"
      onBack={handleBackToReports}
    >
      <div className="dashboard-layout__body">
        {/* Filtros */}
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onApply={generateReport}
          isLoading={isGenerating}
          applyIcon={<ChartIcon size={20} />}
          applyLabel="Generar Reporte"
          disabled={isGenerating}
          extraFields={
            <>
              <div className="filter-card__field">
                <Select
                  label="Rol"
                  options={availableRoles}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="filter-card__field">
                <SearchableSelect
                  label="Departamento"
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  disabled={isGenerating || loadingDepts || zoneDepartments.length === 0}
                  placeholder="Selecione un departamento..."
                  options={[
                    ...zoneDepartments
                      .filter((entry) => entry?.department?._id)
                      .map((entry) => ({
                        value: entry.department._id,
                        label: entry.department.name,
                      })),
                  ]}
                />
              </div>
              <div className="filter-card__field">
                <SearchableSelect
                  label="Municipio"
                  value={selectedMunicipality}
                  onChange={setSelectedMunicipality}
                  disabled={isGenerating || !selectedDepartment || municipalities.length === 0}
                  placeholder="Selecione un municipio..."
                  options={[
                    ...municipalities
                      .filter((muni) => muni?._id)
                      .map((muni) => ({
                        value: muni._id,
                        label: muni.name,
                      })),
                  ]}
                />
              </div>
            </>
          }
          extraActions={
            <>
              {hasData && (
                <button
                  className="btn btn--excel"
                  onClick={exportToExcel}
                  disabled={isGenerating}
                >
                  <ExcelIcon size={16} />
                  Exportar Excel
                </button>
              )}
              <ToggleUnsuccessful />
            </>
          }
        />

        {/* Resumen del reporte */}
        {reportSummaryLabel && hasData && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
            border: '1px solid #a5d6a7',
            borderRadius: '10px',
            color: '#2e7d32',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}>
            <ChartIcon size={18} />
            {reportSummaryLabel}
          </div>
        )}

        {/* Totales */}
        {hasData && (
          <StatsGrid className="reports-stats" style={{ marginBottom: '1.5rem' }}>
            <StatCard
              icon={<ChartIcon size={24} />}
              value={summaryData?.totalEncuestas ?? summaryData?.totalIntervenciones ?? totals.interventions}
              label="Total de Intervenciones"
              variant="primary"
            />
            <StatCard
              icon={<CheckIcon size={24} />}
              value={summaryData?.totalExitosas ?? totals.successful}
              label="Exitosas"
              variant="success"
            />
            {showUnsuccessful && (
              <StatCard
                icon={<XIcon size={24} />}
                value={summaryData?.totalNoExitosas ?? totals.unsuccessful}
                label="No Exitosas"
                variant="danger"
              />
            )}
            <StatCard
              icon={<StarIcon size={24} />}
              value={summaryData?.totalIsPatriaDefender ?? summaryData?.totalDefensores ?? totals.defensores}
              label="Defensores de la Patria"
              variant="warning"
            />
            <StatCard
              icon={<VerifiedIcon size={24} />}
              value={summaryData?.totalIsVerified ?? summaryData?.totalVerified ?? totals.verificados}
              label="Verificadas"
              variant="info"
            />
            <StatCard
              icon={<HomeIcon size={24} />}
              value={summaryData?.linkedHomes ?? summaryData?.totalLinkedHomes ?? totals.linkedHomes}
              label="Hogares Vinculados"
              variant="success"
            />
            <StatCard
              icon={<PlusIcon size={24} />}
              value={summaryData?.totalIsLinkedHouse ?? totals.isLinkedHouse}
              label="Vinculaciones Extras"
              variant="purple"
            />
            <StatCard
              icon={<WifiIcon size={24} />}
              value={summaryData?.totalIsOffline ?? totals.isOffline}
              label="Registro Sin Conexión"
              variant="info"
            />
          </StatsGrid>
        )}

        {/* Tabla */}
        <div className="rg-table-container">
          <ReportTable<SocializerRow>
            columns={memoizedColumns}
            data={reportData}
            getRowKey={(item) => item.socializerId}
            isLoading={isGenerating}
            emptyTitle="Sin datos"
            emptyDescription="Seleccione un rango de fechas, un rol y haga clic en Generar Reporte para ver el resumen."
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
