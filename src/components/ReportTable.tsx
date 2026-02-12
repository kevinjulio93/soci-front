/**
 * ReportTable - Tabla de resultados de reporte con empty state integrado
 * Muestra una tabla vacía cuando no hay datos y la llena cuando se genera el reporte
 */

import type { ReactNode } from 'react'

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
          {data.length > 0 ? (
            data.map((item, idx) => (
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
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="rg-table__empty-cell">
                <div className="rg-table-empty">
                  {emptyIcon ? (
                    <div className="rg-table-empty__icon">{emptyIcon}</div>
                  ) : (
                    <div className="rg-table-empty__icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                  <h4 className="rg-table-empty__title">{emptyTitle}</h4>
                  <p className="rg-table-empty__description">{emptyDescription}</p>
                  {emptyAction && (
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={emptyAction.onClick}
                      style={{ marginTop: '1rem' }}
                    >
                      {emptyAction.icon}
                      {emptyAction.label}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
