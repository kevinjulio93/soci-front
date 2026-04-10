import { type ReactNode } from 'react'
import { DateInput } from './DateInput'
import { FilterIcon } from './Icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
        if (val && endDate && val > endDate) onEndDateChange(val)
    }

    const handleEndDateChange = (val: string) => {
        onEndDateChange(val)
        if (val && startDate && val < startDate) onStartDateChange(val)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <FilterIcon size={16} />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DateInput
                        label="Fecha Inicio"
                        value={startDate}
                        max={endDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        disabled={isLoading || disabled}
                        required
                    />
                    <DateInput
                        label="Fecha Fin"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        disabled={isLoading || disabled}
                        required
                    />
                    {extraFields}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {onApply && (
                        <Button
                            onClick={onApply}
                            disabled={!startDate || !endDate || isLoading || disabled}
                            className="gap-1.5"
                        >
                            {applyIcon}
                            {isLoading ? 'Cargando...' : applyLabel}
                        </Button>
                    )}
                    {extraActions}
                </div>

                {children}
            </CardContent>
        </Card>
    )
}
