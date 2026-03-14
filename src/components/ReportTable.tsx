/**
 * ReportTable - Tabla de resultados de reporte con empty state integrado
 * Muestra una tabla vacía cuando no hay datos y la llena cuando se genera el reporte
 */

import type { ReactNode } from 'react'
import { FileIcon } from './Icons'

export interface ReportTableColumn<T> {
  key: string
  label: string
  minWidth?: string
  align?: 'left' | 'center' | 'right'
  render: (item: T, index: number) => ReactNode
}

interface ReportTableProps<T> {
  columns: ReportTableColumn<T>[]
  data: T[]
  getRowKey: (item: T) => string
  isLoading?: boolean
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
}

export function ReportTable<T>({
  columns,
  data,
  getRowKey,
  isLoading = false,
  emptyIcon,
  emptyTitle = 'Sin datos para mostrar',
  emptyDescription = 'Configure los filtros y genere un reporte para ver los resultados.',
  emptyAction,
}: ReportTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rg-table-loading">
        <div className="rg-table-loading__spinner" />
        <p className="rg-table-loading__text">Generando reporte...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rg-table-empty" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {emptyIcon ? (
          <div className="rg-table-empty__icon" style={{ opacity: 0.5, marginBottom: '1rem' }}>{emptyIcon}</div>
        ) : (
          <div className="rg-table-empty__icon" style={{ opacity: 0.5, marginBottom: '1rem' }}>
            <FileIcon size={64} strokeWidth={1} />
          </div>
        )}
        <h4 className="rg-table-empty__title" style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '0.5rem' }}>{emptyTitle}</h4>
        <p className="rg-table-empty__description" style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>{emptyDescription}</p>
        {emptyAction && (
          <button
            className="btn btn--primary"
            onClick={emptyAction.onClick}
            style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          >
            {emptyAction.icon}
            {emptyAction.label}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rg-table-wrapper">
      <table className="rg-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="rg-table__th"
                style={{
                  textAlign: col.align || 'left',
                  minWidth: col.minWidth,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={getRowKey(item)} className="rg-table__row">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="rg-table__td"
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render(item, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
