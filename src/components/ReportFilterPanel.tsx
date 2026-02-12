/**
 * ReportFilterPanel - Panel lateral derecho de filtros para reportes
 * Se puede abrir/cerrar mediante un botón toggle
 */

import { DateInput, Select, Input } from './index'
import { getTodayISO } from '../utils/dateHelpers'
import { useState } from 'react'

export interface ReportFilters {
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

export const INITIAL_FILTERS: ReportFilters = {
  startDate: getTodayISO(),
  endDate: getTodayISO(),
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
}

interface ReportFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  filters: ReportFilters
  onFilterChange: (field: keyof ReportFilters, value: string) => void
  onGenerate: () => void
  onExportCSV: () => void
  onClear: () => void
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
  onClear,
  isGenerating,
  hasData,
}: ReportFilterPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const canGenerate = !!filters.startDate && !!filters.endDate && !isGenerating

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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <h3 className="rg-panel__title">Filtros de Reporte</h3>
          </div>
          <button
            className="rg-panel__close-btn"
            onClick={onClose}
            title="Cerrar filtros"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body con scroll */}
        <div className="rg-panel__body">
          {/* Rango de Fechas */}
          <div className="rg-panel__section">
            <div className="rg-panel__section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7c6f" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Rango de Fechas</span>
              <span className="rg-panel__required">*</span>
            </div>
            <div className="rg-panel__field">
              <DateInput
                label="Desde"
                value={filters.startDate}
                onChange={(e) => onFilterChange('startDate', e.target.value)}
                disabled={isGenerating}
                required
              />
            </div>
            <div className="rg-panel__field">
              <DateInput
                label="Hasta"
                value={filters.endDate}
                onChange={(e) => onFilterChange('endDate', e.target.value)}
                disabled={isGenerating}
                required
              />
            </div>
          </div>

          {/* Búsqueda y Estado */}
          <div className="rg-panel__section">
            <div className="rg-panel__section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7c6f" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Búsqueda y Estado</span>
            </div>
            <div className="rg-panel__field">
              <Input
                label="Buscar por nombre o ID"
                value={filters.q}
                onChange={(e) => onFilterChange('q', e.target.value)}
                placeholder="Nombre, identificación..."
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
                  { value: 'unsuccessful', label: '✗ No Exitosas' },
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
          </div>

          {/* Filtros Avanzados */}
          <div className="rg-panel__section rg-panel__section--collapsible">
            <button
              className="rg-panel__collapse-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
              type="button"
            >
              <div className="rg-panel__collapse-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7c6f" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                <span>Filtros Avanzados</span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
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
                    <Input
                      label="Departamento"
                      value={filters.department}
                      onChange={(e) => onFilterChange('department', e.target.value)}
                      placeholder="ej: Atlántico"
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="rg-panel__field">
                    <Input
                      label="Ciudad"
                      value={filters.city}
                      onChange={(e) => onFilterChange('city', e.target.value)}
                      placeholder="ej: Barranquilla"
                      disabled={isGenerating}
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
            className="btn btn--primary"
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
              <>📊 Generar Reporte</>
            )}
          </button>
          <div className="rg-panel__footer-row">
            <button
              className="btn btn--secondary"
              onClick={onExportCSV}
              disabled={isGenerating || !hasData}
              style={{ flex: 1 }}
            >
              📥 Exportar CSV
            </button>
            <button
              className="btn btn--secondary"
              onClick={onClear}
              disabled={isGenerating}
              style={{ flex: 1 }}
            >
              🔄 Limpiar
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
