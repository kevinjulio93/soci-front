/**
 * ReportFilterPanel - Panel lateral derecho de filtros para reportes
 * Se puede abrir/cerrar mediante un botón toggle
 */

import { DateInput } from './DateInput'
import { Select } from './Select'
import { Input } from './Input'
import { getTodayISO } from '../utils/dateHelpers'
import { useState, useEffect } from 'react'
import { useUnsuccessfulToggle } from '../hooks/useUnsuccessfulToggle'
import { apiService, type ZoneDepartmentEntry, type ZoneMunicipalityItem } from '../services/api.service'
import { FilterIcon, XIcon, CalendarIcon, SearchIcon, SlidersIcon, ChevronDownIcon, ChartIcon, ExcelIcon } from './Icons'

export interface ReportFilters {
  startDate: string
  endDate: string
  q: string
  surveyStatus: '' | 'successful' | 'unsuccessful'
  willingToRespond: '' | 'true' | 'false'
  isPatriaDefender: '' | 'true' | 'false'
  isVerified: '' | 'true' | 'false'
  isLinkedHouse: '' | 'true' | 'false'
  department: string
  city: string
  neighborhood: string
  gender: string
  ageRange: string
  stratum: string
  idType: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export const INITIAL_FILTERS: ReportFilters = {
  startDate: getTodayISO(),
  endDate: getTodayISO(),
  q: '',
  surveyStatus: '',
  willingToRespond: '',
  isPatriaDefender: '',
  isVerified: '',
  isLinkedHouse: '',
  department: '',
  city: '',
  neighborhood: '',
  gender: '',
  ageRange: '',
  stratum: '',
  idType: '',
  sortBy: '',
  sortOrder: 'asc',
}

interface ReportFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  filters: ReportFilters
  onFilterChange: (field: keyof ReportFilters, value: string) => void
  onGenerate: () => void
  onExportCSV: () => void
  isGenerating: boolean
  hasData: boolean
}

export function ReportFilterPanel({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onGenerate,
  onExportCSV,
  isGenerating,
  hasData,
}: ReportFilterPanelProps) {
  const ACTIVE_ZONE = import.meta.env.VITE_ACTIVE_ZONE || 'zona1'
  const ZONE_ALIASES: Record<string, number> = { zonaf: 6 }
  const ZONE_NUMBER = ZONE_ALIASES[ACTIVE_ZONE] ?? (parseInt(ACTIVE_ZONE.replace('zona', ''), 10) || 1)

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [zoneDepartments, setZoneDepartments] = useState<ZoneDepartmentEntry[]>([])
  const [municipalities, setMunicipalities] = useState<ZoneMunicipalityItem[]>([])
  const [loadingDepts, setLoadingDepts] = useState(false)
  const { showUnsuccessful } = useUnsuccessfulToggle()

  const canGenerate = !!filters.startDate && !!filters.endDate && !isGenerating

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
    if (!filters.department) {
      setMunicipalities([])
      return
    }

    // Buscar el departamento seleccionado en la data ya cargada
    const selectedDept = zoneDepartments.find(d => d?.department?._id === filters.department)
    if (selectedDept?.municipalities) {
      setMunicipalities(selectedDept.municipalities)
    } else {
      setMunicipalities([])
    }
  }, [filters.department, zoneDepartments])

  const handleDepartmentChange = (value: string) => {
    onFilterChange('department', value)
    // Limpiar ciudad al cambiar departamento
    onFilterChange('city', '')
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="rg-panel-overlay"
          onClick={onClose}
        />
      )}

      <aside className={`rg-panel ${isOpen ? 'rg-panel--open' : ''}`}>
        {/* Header */}
        <div className="rg-panel__header">
          <div className="rg-panel__header-left">
            <FilterIcon size={20} />
            <h3 className="rg-panel__title">Filtros de Reporte</h3>
          </div>
          <button
            className="rg-panel__close-btn"
            onClick={onClose}
            title="Cerrar filtros"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Body con scroll */}
        <div className="rg-panel__body">
          {/* Rango de Fechas */}
          <div className="rg-panel__section">
            <div className="rg-panel__section-title">
              <CalendarIcon size={16} color="#4a7c6f" />
              <span>Rango de Fechas</span>
              <span className="rg-panel__required">*</span>
            </div>
            <div className="rg-panel__field">
              <DateInput
                label="Desde"
                value={filters.startDate}
                max={filters.endDate}
                onChange={(e) => onFilterChange('startDate', e.target.value)}
                disabled={isGenerating}
                required
              />
            </div>
            <div className="rg-panel__field">
              <DateInput
                label="Hasta"
                value={filters.endDate}
                min={filters.startDate}
                onChange={(e) => onFilterChange('endDate', e.target.value)}
                disabled={isGenerating}
                required
              />
            </div>
          </div>

          {/* Búsqueda y Estado */}
          <div className="rg-panel__section">
            <div className="rg-panel__section-title">
              <SearchIcon size={16} color="#4a7c6f" />
              <span>Búsqueda y Estado</span>
            </div>
            <div className="rg-panel__field">
              <Input
                label="Buscar por correo"
                value={filters.q}
                onChange={(e) => onFilterChange('q', e.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={isGenerating}
              />
            </div>
            <div className="rg-panel__field">
              <Select
                label="Estado de la Encuesta"
                value={filters.surveyStatus}
                onChange={(e) => onFilterChange('surveyStatus', e.target.value as ReportFilters['surveyStatus'])}
                disabled={isGenerating}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'successful', label: '✓ Exitosas' },
                  ...(showUnsuccessful ? [{ value: 'unsuccessful', label: '✗ No Exitosas' }] as any : []),
                ]}
              />
            </div>
            <div className="rg-panel__field">
              <Select
                label="Dispuesto a Responder"
                value={filters.willingToRespond}
                onChange={(e) => onFilterChange('willingToRespond', e.target.value as ReportFilters['willingToRespond'])}
                disabled={isGenerating}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'true', label: 'Sí' },
                  { value: 'false', label: 'No' },
                ]}
              />
            </div>
            <div className="rg-panel__field">
              <Select
                label="Defensor de la Patria"
                value={filters.isPatriaDefender}
                onChange={(e) => onFilterChange('isPatriaDefender', e.target.value as ReportFilters['isPatriaDefender'])}
                disabled={isGenerating}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'true', label: 'Sí' },
                  { value: 'false', label: 'No' },
                ]}
              />
            </div>
            <div className="rg-panel__field">
              <Select
                label="Verificado"
                value={filters.isVerified}
                onChange={(e) => onFilterChange('isVerified', e.target.value as ReportFilters['isVerified'])}
                disabled={isGenerating}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'true', label: 'Verificado' },
                  { value: 'false', label: 'No Verificado' },
                ]}
              />
            </div>
            <div className="rg-panel__field">
              <Select
                label="Persona adicional en vivienda"
                value={filters.isLinkedHouse}
                onChange={(e) => onFilterChange('isLinkedHouse', e.target.value as ReportFilters['isLinkedHouse'])}
                disabled={isGenerating}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'true', label: 'Sí' },
                  { value: 'false', label: 'No' },
                ]}
              />
            </div>
          </div>

          {/* Filtros Avanzados */}
          <div className="rg-panel__section rg-panel__section--collapsible">
            <button
              className="rg-panel__collapse-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
              type="button"
            >
              <div className="rg-panel__collapse-left">
                <SlidersIcon size={16} color="#4a7c6f" />
                <span>Filtros Avanzados</span>
              </div>
              <ChevronDownIcon
                size={16}
                style={{
                  transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}
              />
            </button>

            {showAdvanced && (
              <div className="rg-panel__advanced-body">
                {/* Demográficos */}
                <div className="rg-panel__subsection">
                  <h4 className="rg-panel__subsection-title">👥 Datos Demográficos</h4>
                  <div className="rg-panel__field">
                    <Select
                      label="Género"
                      value={filters.gender}
                      onChange={(e) => onFilterChange('gender', e.target.value)}
                      disabled={isGenerating}
                      options={[
                        { value: '', label: 'Todos' },
                        { value: 'Masculino', label: 'Masculino' },
                        { value: 'Femenino', label: 'Femenino' },
                        { value: 'Otro', label: 'Otro' },
                      ]}
                    />
                  </div>
                  <div className="rg-panel__field">
                    <Select
                      label="Rango de Edad"
                      value={filters.ageRange}
                      onChange={(e) => onFilterChange('ageRange', e.target.value)}
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
                  <div className="rg-panel__field">
                    <Select
                      label="Estrato Socioeconómico"
                      value={filters.stratum}
                      onChange={(e) => onFilterChange('stratum', e.target.value)}
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
                  </div>
                  <div className="rg-panel__field">
                    <Select
                      label="Tipo de Identificación"
                      value={filters.idType}
                      onChange={(e) => onFilterChange('idType', e.target.value)}
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

                {/* Ubicación */}
                <div className="rg-panel__subsection">
                  <h4 className="rg-panel__subsection-title">📍 Ubicación</h4>
                  <div className="rg-panel__field">
                    <Select
                      label="Departamento"
                      value={filters.department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      disabled={isGenerating || loadingDepts || zoneDepartments.length === 0}
                      options={[
                        { value: '', label: 'Todos' },
                        ...zoneDepartments
                          .filter((entry) => entry?.department?._id)
                          .map((entry) => ({
                            value: entry.department._id,
                            label: entry.department.name,
                          })),
                      ]}
                    />
                  </div>
                  <div className="rg-panel__field">
                    <Select
                      label="Municipio"
                      value={filters.city}
                      onChange={(e) => onFilterChange('city', e.target.value)}
                      disabled={isGenerating || !filters.department || municipalities.length === 0}
                      options={[
                        { value: '', label: 'Todos' },
                        ...municipalities
                          .filter((muni) => muni?._id)
                          .map((muni) => ({
                            value: muni._id,
                            label: muni.name,
                          })),
                      ]}
                    />
                  </div>
                  <div className="rg-panel__field">
                    <Input
                      label="Barrio"
                      value={filters.neighborhood}
                      onChange={(e) => onFilterChange('neighborhood', e.target.value)}
                      placeholder="ej: Centro Histórico"
                      disabled={isGenerating}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer con botones */}
        <div className="rg-panel__footer">
          <button
            className="btn btn--primary btn--with-icon"
            onClick={onGenerate}
            disabled={!canGenerate}
            style={{ width: '100%' }}
          >
            {isGenerating ? (
              <>
                <span className="rg-panel__spinner" />
                Generando...
              </>
            ) : (
              <>
                <ChartIcon size={20} />
                Generar Reporte
              </>
            )}
          </button>
          <div className="rg-panel__footer-row">
            <button
              className="btn btn--excel"
              onClick={onExportCSV}
              disabled={isGenerating || !hasData}
              style={{ flex: 1, width: '100%' }}
            >
              <ExcelIcon size={20} />
              Exportar Excel
            </button>
          </div>
          <button
            className="btn btn--secondary rg-panel__close-mobile"
            onClick={onClose}
            type="button"
          >
            Cerrar filtros
          </button>
        </div>
      </aside>
    </>
  )
}
