/**
 * Pagination - Componente reutilizable de paginación
 * Principio: Single Responsibility (solo maneja la paginación)
 */

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
  onItemsPerPageChange?: (perPage: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  maxVisiblePages = 5,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      const left = Math.max(currentPage - 1, 1)
      const right = Math.min(currentPage + 1, totalPages)
      pages.push(1)
      if (left > 2) pages.push('...')
      for (let i = left; i <= right; i++) {
        if (i !== 1 && i !== totalPages) pages.push(i)
      }
      if (right < totalPages - 1) pages.push('...')
      if (totalPages > 1) pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex flex-col items-center gap-3 py-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando {startItem}–{endItem} de {totalItems} registros
      </p>

      <div className="flex items-center gap-2">
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Mostrar</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="h-7 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ←
          </Button>

          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={`sep-${index}`} className="px-1 text-muted-foreground text-sm">…</span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="icon-xs"
                onClick={() => typeof page === 'number' && onPageChange(page)}
                className={cn(page === currentPage && 'pointer-events-none')}
              >
                {page}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            →
          </Button>
        </div>
      </div>
    </div>
  )
}
