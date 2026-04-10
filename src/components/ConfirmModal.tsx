/**
 * ConfirmModal - Modal de confirmación reutilizable
 * Modal genérico para confirmar acciones destructivas
 */

import { useCallback, useMemo } from 'react'
import { AlertCircleIcon, AlertTriangleIcon, InfoIcon } from './Icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  const handleConfirm = useCallback(() => {
    onConfirm()
  }, [onConfirm])

  const iconByVariant = useMemo(() => {
    const iconClass = cn(
      'flex items-center justify-center rounded-full p-3 w-16 h-16 mx-auto mb-2',
      {
        'bg-destructive/10 text-destructive': variant === 'danger',
        'bg-amber-100 text-amber-600': variant === 'warning',
        'bg-blue-100 text-blue-600': variant === 'info',
      }
    )
    switch (variant) {
      case 'danger':
        return <div className={iconClass}><AlertCircleIcon size={36} /></div>
      case 'warning':
        return <div className={iconClass}><AlertTriangleIcon size={36} /></div>
      case 'info':
        return <div className={iconClass}><InfoIcon size={36} /></div>
    }
  }, [variant])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="text-center">
            {iconByVariant}
            <DialogTitle className="text-lg mt-2">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-center">{message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
