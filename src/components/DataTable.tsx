/**
 * DataTable - Componente genérico de tabla reutilizable
 * Puede ser usado para cualquier tipo de datos
 */

import type { ReactNode } from 'react'
import { useCallback, useMemo } from 'react'
import { Pagination } from './Pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(data.map(item => getRowKey(item))))
    }
  }, [onSelectionChange, data, getRowKey, safeSelectedItems])

  const handleSelectItem = useCallback((id: string) => {
    if (!onSelectionChange) return
    const next = new Set(safeSelectedItems)
    next.has(id) ? next.delete(id) : next.add(id)
    onSelectionChange(next)
  }, [onSelectionChange, safeSelectedItems])

  const isAllSelected = useMemo(
    () => data.length > 0 && safeSelectedItems.size === data.length,
    [data.length, safeSelectedItems]
  )

  const colSpan = selectable ? columns.length + 1 : columns.length

  const isUnsuccessfulRow = useCallback((item: T): boolean => {
    if (!item || typeof item !== 'object' || !('surveyStatus' in item)) return false
    return (item as { surveyStatus?: string }).surveyStatus === 'unsuccessful'
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {showSearch && onSearch && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded border-input"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    {emptyStateIcon && (
                      <div className="text-muted-foreground opacity-40 [&_svg]:size-12">{emptyStateIcon}</div>
                    )}
                    <p className="font-medium text-sm">{emptyStateTitle}</p>
                    <p className="text-xs text-muted-foreground">{emptyStateDescription}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => {
                const itemId = getRowKey(item)
                const isUnsuccessful = isUnsuccessfulRow(item)
                return (
                  <TableRow
                    key={itemId}
                    className={cn(isUnsuccessful && 'opacity-60')}
                  >
                    {selectable && (
                      <TableCell className="w-10">
                        <input
                          type="checkbox"
                          checked={safeSelectedItems.has(itemId)}
                          onChange={() => handleSelectItem(itemId)}
                          className="rounded border-input"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.render(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && data.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  )
}
