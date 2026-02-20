/**
 * DataTable - Componente genérico de tabla reutilizable
 * Puede ser usado para cualquier tipo de datos
 */

import type { ReactNode } from 'react'
import { useCallback, useMemo } from 'react'
import { Pagination } from './Pagination'
import '../styles/Dashboard.scss'

export interface TableColumn<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage?: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (perPage: number) => void
  pageSizeOptions?: number[]
  isLoading?: boolean
  emptyStateIcon?: React.ReactNode
  emptyStateTitle?: string
  emptyStateDescription?: string
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  showSearch?: boolean
  getRowKey: (item: T) => string
  // Selection support
  selectable?: boolean
  selectedItems?: Set<string>
  onSelectionChange?: (selectedIds: Set<string>) => void
}

export function DataTable<T = Record<string, unknown>>({
  columns,
  data,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions,
  isLoading = false,
  emptyStateIcon,
  emptyStateTitle = 'No hay registros',
  emptyStateDescription = 'No se encontraron registros para mostrar',
  searchPlaceholder = 'Buscar...',
  onSearch,
  showSearch = false,
  getRowKey,
  selectable = false,
  selectedItems,
  onSelectionChange,
}: DataTableProps<T>) {
  const safeSelectedItems = useMemo(() => selectedItems ?? new Set<string>(), [selectedItems])

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return
    
    if (safeSelectedItems.size === data.length) {
      // Deselect all
      onSelectionChange(new Set())
    } else {
      // Select all on current page
      const allIds = new Set(data.map(item => getRowKey(item)))
      onSelectionChange(allIds)
    }
  }, [onSelectionChange, data, getRowKey, safeSelectedItems])

  const handleSelectItem = useCallback((id: string) => {
    if (!onSelectionChange) return
    
    const newSelection = new Set(safeSelectedItems)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    onSelectionChange(newSelection)
  }, [onSelectionChange, safeSelectedItems])

  const isAllSelected = useMemo(
    () => data.length > 0 && safeSelectedItems.size === data.length,
    [data.length, safeSelectedItems]
  )

  const colSpan = useMemo(
    () => (selectable ? columns.length + 1 : columns.length),
    [columns.length, selectable]
  )

  const isUnsuccessfulRow = useCallback((item: T): boolean => {
    if (!item || typeof item !== 'object') return false
    if (!('surveyStatus' in item)) return false
    return (item as { surveyStatus?: string }).surveyStatus === 'unsuccessful'
  }, [])
  return (
    <div className="survey-table">
      {showSearch && onSearch && (
        <div className="survey-table__header">
          <div className="survey-table__search-row">
            <div className="survey-table__search-box">
              <input
                type="text"
                className="survey-table__search-input"
                placeholder={searchPlaceholder}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="survey-table__wrapper">
        {!isLoading && data.length === 0 ? (
          <div className="empty-state">
            {emptyStateIcon && <div className="empty-state__icon">{emptyStateIcon}</div>}
            <h3 className="empty-state__title">{emptyStateTitle}</h3>
            <p className="empty-state__description">{emptyStateDescription}</p>
          </div>
        ) : (
          <table className="survey-table__table">
            <thead className="survey-table__thead">
              <tr>
                {selectable && (
                  <th className="survey-table__th survey-table__th--checkbox">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="table-checkbox"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th key={column.key} className={`survey-table__th ${column.className || ''}`}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="survey-table__tbody">
              {isLoading ? (
                <tr className="survey-table__row">
                  <td colSpan={colSpan} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Cargando...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const itemId = getRowKey(item)
                  // Verificar si es una fila sin datos (unsuccessful survey)
                  const isUnsuccessful = isUnsuccessfulRow(item)
                  return (
                    <tr key={itemId} className={`survey-table__row ${isUnsuccessful ? 'survey-table__row--unsuccessful' : ''}`}>
                      {selectable && (
                        <td className="survey-table__td survey-table__td--checkbox">
                          <input
                            type="checkbox"
                            checked={safeSelectedItems.has(itemId)}
                            onChange={() => handleSelectItem(itemId)}
                            className="table-checkbox"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.key} className={`survey-table__td ${column.className || ''}`}>
                          {column.render(item)}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && data.length > 0 && (
        <div className="survey-table__footer">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
            pageSizeOptions={pageSizeOptions}
          />
        </div>
      )}
    </div>
  )
}
