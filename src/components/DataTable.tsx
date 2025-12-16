/**
 * DataTable - Componente genérico de tabla reutilizable
 * Puede ser usado para cualquier tipo de datos
 */

import { Pagination } from './Pagination'
import '../styles/Dashboard.scss'

export interface TableColumn<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
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
  isLoading?: boolean
  emptyStateIcon?: React.ReactNode
  emptyStateTitle?: string
  emptyStateDescription?: string
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  showSearch?: boolean
  getRowKey: (item: T) => string
}

export function DataTable<T>({
  columns,
  data,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  isLoading = false,
  emptyStateIcon,
  emptyStateTitle = 'No hay registros',
  emptyStateDescription = 'No se encontraron registros para mostrar',
  searchPlaceholder = 'Buscar...',
  onSearch,
  showSearch = false,
  getRowKey,
}: DataTableProps<T>) {
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
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Cargando...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={getRowKey(item)} className="survey-table__row">
                    {columns.map((column) => (
                      <td key={column.key} className={`survey-table__td ${column.className || ''}`}>
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
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
          />
        </div>
      )}
    </div>
  )
}
