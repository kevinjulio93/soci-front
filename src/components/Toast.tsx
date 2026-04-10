/**
 * Toast - Componente de notificaciones toast
 */

import { useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from './Icons'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  onClose: (id: string) => void
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  warning: 'bg-amber-50 border-amber-400 text-amber-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
}

const iconStyles: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

export function Toast({ id, message, type, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircleIcon size={20} />
      case 'error': return <XCircleIcon size={20} />
      case 'warning': return <AlertTriangleIcon size={20} />
      case 'info': return <InfoIcon size={20} />
    }
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md min-w-72 max-w-sm',
        typeStyles[type]
      )}
    >
      <span className={cn('mt-0.5 shrink-0', iconStyles[type])}>
        {getIcon()}
      </span>
      <p className="flex-1 text-sm">{message}</p>
      <button
        className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        onClick={() => onClose(id)}
        aria-label="Cerrar notificación"
      >
        <XIcon size={16} />
      </button>
    </div>
  )
}
