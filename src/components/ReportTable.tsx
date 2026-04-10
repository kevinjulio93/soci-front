/**
 * ReportTable - Tabla de resultados de reporte con empty state integrado
 * Muestra una tabla vacía cuando no hay datos y la llena cuando se genera el reporte
 */

import type { ReactNode } from 'react'
import { FileIcon } from './Icons'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

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
  const colSpan = columns.length

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                style={{ textAlign: col.align ?? 'left', minWidth: col.minWidth }}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="text-muted-foreground opacity-40 [&_svg]:size-14">
                    {emptyIcon ?? <FileIcon size={56} strokeWidth={1} />}
                  </div>
                  <p className="text-base font-semibold text-foreground">{emptyTitle}</p>
                  <p className="max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
                  {emptyAction && (
                    <Button onClick={emptyAction.onClick} className="mt-1 gap-1.5">
                      {emptyAction.icon}
                      {emptyAction.label}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, idx) => (
              <TableRow key={getRowKey(item)}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    style={{ textAlign: col.align ?? 'left' }}
                  >
                    {col.render(item, idx)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
