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
import { useZoneApi } from '../contexts/ZoneApiContext'
import type { ReportTableColumn } from '../components/ReportTable'
import { apiService, type ZoneDepartmentEntry, type ZoneMunicipalityItem } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { ROUTES } from '../constants'
import '../styles/Dashboard.scss'

// Valor especial para "Todas las zonas"
const ALL_ZONES = '__all_zones__'

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
  /** Nombre de la zona (solo cuando se consultan múltiples zonas) */
  zoneName?: string
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
  const { zones, selectedZoneIds, setSelectedZoneIds, isLoadingZones, isSuperAdmin, querySelectedZones } = useZoneApi()
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
  // Selector de zona local (UI): '' = zona actual, ALL_ZONES = todas, o un _id específico
  const [selectedZone, setSelectedZone] = useState('')
  /** true cuando el reporte se generó consultando múltiples zonas */
  const [isMultiZone, setIsMultiZone] = useState(false)
  /** Errores parciales en consultas multi-zona */
  const [zoneErrors, setZoneErrors] = useState<string[]>([])

  const { showUnsuccessful } = useUnsuccessfulToggle()

  const userRole = user?.role?.role?.toLowerCase() || ''

  const ACTIVE_ZONE = import.meta.env.VITE_ACTIVE_ZONE || 'zona1'
  const ZONE_ALIASES: Record<string, number> = { zonaf: 6 }
  const ZONE_NUMBER = ZONE_ALIASES[ACTIVE_ZONE] ?? (parseInt(ACTIVE_ZONE.replace('zona', ''), 10) || 1)

  const isAdminOrSuperadmin = isSuperAdmin || userRole === 'superadmin'

  // Sincronizar selección local con el contexto de zonas
  useEffect(() => {
    if (selectedZone === ALL_ZONES) {
      setSelectedZoneIds(zones.map(z => z._id))
    } else if (selectedZone) {
      setSelectedZoneIds([selectedZone])
    } else {
      setSelectedZoneIds([])
    }
  }, [selectedZone, zones, setSelectedZoneIds])

  // Determinar el número de zona a usar para cargar departamentos
  const activeZoneNumber = useMemo(() => {
    if (isAdminOrSuperadmin && selectedZone && selectedZone !== ALL_ZONES) {
      const zone = zones.find(z => z._id === selectedZone)
      return zone?.zoneNumber ?? ZONE_NUMBER
    }
    return ZONE_NUMBER
  }, [isAdminOrSuperadmin, selectedZone, zones, ZONE_NUMBER])

  // Cargar departamentos y municipios de la zona activa
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepts(true)
      try {
        const response = await apiService.getZoneDepartments(activeZoneNumber)
        setZoneDepartments(response.departments)
      } catch {
        setZoneDepartments([])
      } finally {
        setLoadingDepts(false)
      }
    }
    loadDepartments()
  }, [activeZoneNumber])

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

  const handleZoneChange = (value: string) => {
    setSelectedZone(value)
    setSelectedDepartment('')
    setSelectedMunicipality('')
    setZoneDepartments([])
    setMunicipalities([])
    setReportData([])
    setSummaryData(null)
    setReportSummaryLabel('')
    setZoneErrors([])
  }

  // ¿Se están consultando múltiples zonas?
  const willQueryMultipleZones = isAdminOrSuperadmin && selectedZone === ALL_ZONES
  // ¿Filtros de ubicación deshabilitados? (no aplican cuando se consultan todas las zonas)
  const locationFiltersDisabled = willQueryMultipleZones

  // Filtrar roles disponibles según la jerarquía del usuario
  const availableRoles = useMemo(() => {
    const roleOrder = ['zonecoordinator', 'fieldcoordinator', 'supervisor', 'socializer']
    const userRoleIndex = roleOrder.indexOf(userRole)

    if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'readonly') {
      return ROLE_HIERARCHY
    }

    // Mostrar solo roles por debajo del actual
    const childRoles = roleOrder.slice(userRoleIndex + 1)
    return ROLE_HIERARCHY.filter(r => childRoles.includes(r.value))
  }, [userRole])

  // Optimización: Memoizar las columnas de la tabla para evitar re-renders innecesarios en DataTable
  // Basado en la regla: rerender-memo
  const memoizedColumns = useMemo(() => {
    const base = showUnsuccessful
      ? TABLE_COLUMNS
      : TABLE_COLUMNS.filter(c => c.key !== 'unsuccessful')

    // Agregar columna de zona cuando se consultan múltiples zonas
    if (isMultiZone) {
      const zoneColumn: ReportTableColumn<SocializerRow> = {
        key: 'zoneName',
        label: 'Zona',
        minWidth: '120px',
        render: (item) => (
          <span style={{ fontWeight: 600, color: '#0066cc' }}>{item.zoneName || '—'}</span>
        ),
      }
      return [zoneColumn, ...base]
    }
    return base
  }, [showUnsuccessful, isMultiZone])

  const handleBackToReports = () => navigate(ROUTES.ADMIN_REPORTS)

  /** Construye los parámetros de consulta para el dashboard003 */
  const buildReportParams = () => {
    const params: { fecha_inicio: string; fecha_fin: string; rol?: string; departamentoId?: string; municipioId?: string } = {
      fecha_inicio: startDate,
      fecha_fin: endDate,
    }
    if (selectedRole) params.rol = selectedRole
    if (selectedDepartment) params.departamentoId = selectedDepartment
    if (selectedMunicipality) params.municipioId = selectedMunicipality
    return params
  }

  /** Mapea un socializador del API a una fila de la tabla */
  const mapSocializerRow = (s: any, zoneName?: string): SocializerRow => ({
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
    zoneName,
  })

  /** Agrega resúmenes de múltiples zonas */
  const aggregateSummaries = (summaries: any[]): any => {
    return summaries.reduce((acc, s) => {
      if (!s) return acc
      return {
        totalEncuestas: (acc.totalEncuestas || 0) + (s.totalEncuestas || 0),
        totalIntervenciones: (acc.totalIntervenciones || 0) + (s.totalIntervenciones || 0),
        totalExitosas: (acc.totalExitosas || 0) + (s.totalExitosas || 0),
        totalNoExitosas: (acc.totalNoExitosas || 0) + (s.totalNoExitosas || 0),
        totalIsPatriaDefender: (acc.totalIsPatriaDefender || 0) + (s.totalIsPatriaDefender || 0),
        totalDefensores: (acc.totalDefensores || 0) + (s.totalDefensores || 0),
        totalIsLinkedHouse: (acc.totalIsLinkedHouse || 0) + (s.totalIsLinkedHouse || 0),
        totalLinkedHomes: (acc.totalLinkedHomes || 0) + (s.totalLinkedHomes || 0),
        totalIsVerified: (acc.totalIsVerified || 0) + (s.totalIsVerified || 0),
        totalVerificados: (acc.totalVerificados || 0) + (s.totalVerificados || 0),
        totalIsOffline: (acc.totalIsOffline || 0) + (s.totalIsOffline || 0),
        totalSocializers: (acc.totalSocializers || 0) + (s.totalSocializers || 0),
        linkedHomes: (acc.linkedHomes || 0) + (s.linkedHomes || 0),
      }
    }, {} as any)
  }

  const generateReport = async () => {
    if (!startDate || !endDate) {
      notificationService.warning('Por favor seleccione un rango de fechas')
      return
    }
    try {
      setIsGenerating(true)
      setZoneErrors([])

      const params = buildReportParams()

      // ── Consulta multi-zona (superadmin con zonas seleccionadas) ──
      if (isAdminOrSuperadmin && selectedZoneIds.length > 0) {
        const results = await querySelectedZones(async (api) => {
          return api.getDashboard003Report(params)
        })

        const allRows: SocializerRow[] = []
        const allSummaries: any[] = []
        const errors: string[] = []

        for (const result of results) {
          if (result.error || !result.data) {
            errors.push(`${result.zoneName}: ${result.error || 'Sin datos'}`)
            continue
          }
          const socializadores = result.data.socializadores || []
          const rows = socializadores.map((s) =>
            mapSocializerRow(s, result.zoneName)
          )
          allRows.push(...rows)
          if (result.data.resumen) allSummaries.push(result.data.resumen)
        }

        allRows.sort((a, b) => b.interventions - a.interventions)

        setReportData(allRows)
        setIsMultiZone(selectedZoneIds.length > 1)
        setSummaryData(allSummaries.length > 0 ? aggregateSummaries(allSummaries) : null)
        setZoneErrors(errors)

        const rolLabel = availableRoles.find(r => r.value === selectedRole)?.label || 'usuarios'
        const totalIntervenciones = allRows.reduce((s, r) => s + r.interventions, 0)
        const zonesQueried = results.filter(r => !r.error).length
        const summaryText = `Reporte generado: ${allRows.length} ${rolLabel.toLowerCase()}, ${totalIntervenciones} intervenciones (${zonesQueried} zona${zonesQueried !== 1 ? 's' : ''} consultada${zonesQueried !== 1 ? 's' : ''})`
        setReportSummaryLabel(summaryText)
        notificationService.success(summaryText)

        if (errors.length > 0) {
          notificationService.warning(`Errores en ${errors.length} zona(s): ${errors.join('; ')}`)
        }
      } else {
        // ── Consulta normal (zona actual) ──
        const response = await apiService.getDashboard003Report(params)
        const socializadores = response.socializadores || []

        const rows: SocializerRow[] = socializadores
          .map((s) => mapSocializerRow(s))
          .sort((a, b) => b.interventions - a.interventions)

        setReportData(rows)
        setIsMultiZone(false)
        setSummaryData(response.resumen || null)

        const rolLabel = availableRoles.find(r => r.value === selectedRole)?.label || 'usuarios'
        const totalIntervenciones = response.resumen?.totalEncuestas ?? rows.reduce((s, r) => s + r.interventions, 0)
        const summaryText = `Reporte generado: ${rows.length} ${rolLabel.toLowerCase()}, ${totalIntervenciones} intervenciones`
        setReportSummaryLabel(summaryText)
        notificationService.success(summaryText)
      }
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
      const params = buildReportParams()

      // ── Export multi-zona ──
      if (isAdminOrSuperadmin && selectedZoneIds.length > 0) {
        const results = await querySelectedZones(async (api) => {
          return api.exportDashboard003(params)
        })
        const errors = results.filter(r => r.error).map(r => `${r.zoneName}: ${r.error}`)
        const exported = results.filter(r => !r.error).length
        if (exported > 0) {
          notificationService.success(`Excel descargado de ${exported} zona(s)`)
        }
        if (errors.length > 0) {
          notificationService.warning(`Errores al exportar: ${errors.join('; ')}`)
        }
      } else {
        await apiService.exportDashboard003(params)
        notificationService.success('Archivo Excel descargado exitosamente')
      }
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
              {isAdminOrSuperadmin && (
                <div className="filter-card__field">
                  <SearchableSelect
                    label="Zona"
                    value={selectedZone}
                    onChange={handleZoneChange}
                    disabled={isGenerating || isLoadingZones || zones.length === 0}
                    placeholder="Zona actual..."
                    options={[
                      ...zones.map((zone) => ({
                        value: zone._id,
                        label: zone.name,
                      })),
                    ]}
                  />
                </div>
              )}
              <div className="filter-card__field">
                <SearchableSelect
                  label="Departamento"
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  disabled={isGenerating || loadingDepts || zoneDepartments.length === 0 || locationFiltersDisabled}
                  placeholder={locationFiltersDisabled ? 'No aplica con todas las zonas' : 'Selecione un departamento...'}
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
                  disabled={isGenerating || !selectedDepartment || municipalities.length === 0 || locationFiltersDisabled}
                  placeholder={locationFiltersDisabled ? 'No aplica con todas las zonas' : 'Selecione un municipio...'}
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

        {/* Errores parciales en consultas multi-zona */}
        {zoneErrors.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #fff3e0, #fbe9e7)',
            border: '1px solid #ffab91',
            borderRadius: '10px',
            color: '#bf360c',
            fontWeight: 500,
            fontSize: '0.9rem',
          }}>
            <XIcon size={18} />
            <div>
              <strong>Errores en algunas zonas:</strong>
              <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem' }}>
                {zoneErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
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
