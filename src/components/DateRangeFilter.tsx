import { type ReactNode } from 'react'
import { DateInput } from './DateInput'
import { FilterIcon } from './Icons'

interface DateRangeFilterProps {
    startDate: string
    endDate: string
    onStartDateChange: (value: string) => void
    onEndDateChange: (value: string) => void
    onApply?: () => void
    isLoading?: boolean
    title?: string
    applyLabel?: string
    applyIcon?: ReactNode
    extraActions?: ReactNode
    extraFields?: ReactNode
    children?: ReactNode
    disabled?: boolean
}

/**
 * DateRangeFilter - Componente reutilizable para filtrar por rango de fechas.
 * Genera la estructura CSS .filter-card directamente.
 */
export function DateRangeFilter({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onApply,
    isLoading = false,
    title = 'Filtros del Reporte',
    applyLabel = 'Actualizar',
    applyIcon,
    extraActions,
    extraFields,
    children,
    disabled = false,
}: DateRangeFilterProps) {
    const handleStartDateChange = (val: string) => {
        onStartDateChange(val)
        if (val && endDate && val > endDate) {
            onEndDateChange(val)
        }
    }

    const handleEndDateChange = (val: string) => {
        onEndDateChange(val)
        if (val && startDate && val < startDate) {
            onStartDateChange(val)
        }
    }

    return (
        <div className="filter-card">
            <h3 className="filter-card__title">
                <FilterIcon size={18} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
                {title}
            </h3>

            <div className="filter-card__grid">
                <div className="filter-card__field">
                    <DateInput
                        label="Fecha Inicio"
                        value={startDate}
                        max={endDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        disabled={isLoading || disabled}
                        required
                    />
                </div>
                <div className="filter-card__field">
                    <DateInput
                        label="Fecha Fin"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        disabled={isLoading || disabled}
                        required
                    />
                </div>
                {extraFields}
            </div>

            <div className="filter-card__actions">
                {onApply && (
                    <button
                        className="btn btn--primary btn--with-icon"
                        onClick={onApply}
                        disabled={!startDate || !endDate || isLoading || disabled}
                    >
                        {applyIcon}
                        {isLoading ? 'Cargando...' : applyLabel}
                    </button>
                )}
                {extraActions}
            </div>

            {children}
        </div>
    )
}
