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
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed right-0 top-0 h-full z-50 w-80 bg-card shadow-xl flex flex-col transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <FilterIcon size={20} />
            <h3 className="font-semibold text-sm">Filtros de Reporte</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Cerrar filtros"
          >
            <XIcon size={20} />
          </Button>
        </div>

        {/* Body con scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* Rango de Fechas */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
              <CalendarIcon size={16} color="#4a7c6f" />
              <span>Rango de Fechas</span>
              <span className="text-destructive">*</span>
            </div>
            <div className="">
              <DateInput
                label="Desde"
                value={filters.startDate}
                max={filters.endDate}
                onChange={(e) => onFilterChange('startDate', e.target.value)}
                disabled={isGenerating}
                required
              />
            </div>
            <div className="">
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
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
              <SearchIcon size={16} color="#4a7c6f" />
              <span>Búsqueda y Estado</span>
            </div>
            <div className="">
              <Input
                label="Buscar por correo"
                value={filters.q}
                onChange={(e) => onFilterChange('q', e.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={isGenerating}
              />
            </div>
            <div className="">
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
            <div className="">
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
            <div className="">
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
            <div className="">
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
            <div className="">
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
          <div className="flex flex-col gap-2 border-t pt-3">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between px-0 text-sm font-medium hover:bg-transparent"
              onClick={() => setShowAdvanced(!showAdvanced)}
              type="button"
            >
              <div className="flex items-center gap-2">
                <SlidersIcon size={16} color="#4a7c6f" />
                <span>Filtros Avanzados</span>
              </div>
              <ChevronDownIcon
                size={16}
                className={cn('transition-transform duration-300', showAdvanced && 'rotate-180')}
              />
            </Button>

            {showAdvanced && (
              <div className="flex flex-col gap-4 mt-2">
                {/* Demográficos */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-medium text-muted-foreground">👥 Datos Demográficos</h4>
                  <div className="">
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
                  <div className="">
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
                  <div className="">
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
                  <div className="">
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
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-medium text-muted-foreground">📍 Ubicación</h4>
                  <div className="">
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
                  <div className="">
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
                  <div className="">
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
        <div className="flex flex-col gap-2 p-4 border-t flex-shrink-0">
          <Button
            className="w-full gap-2"
            onClick={onGenerate}
            disabled={!canGenerate}
          >
            {isGenerating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <ChartIcon size={20} />
                Generar Reporte
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-300 dark:bg-green-950 dark:text-green-400"
              onClick={onExportCSV}
              disabled={isGenerating || !hasData}
            >
              <ExcelIcon size={20} />
              Exportar Excel
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
            type="button"
          >
            Cerrar filtros
          </Button>
        </div>
      </aside>
    </>
  )
}
