/**
 * Toast - Componente de notificaciones toast
 */

import { useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from './Icons'
import '../styles/Toast.scss'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  onClose: (id: string) => void
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
      case 'success':
        return <CheckCircleIcon size={24} />
      case 'error':
        return <XCircleIcon size={24} />
      case 'warning':
        return <AlertTriangleIcon size={24} />
      case 'info':
        return <InfoIcon size={24} />
    }
  }

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__icon">
        {getIcon()}
      </div>
      <p className="toast__message">{message}</p>
      <button
        className="toast__close"
        onClick={() => onClose(id)}
        aria-label="Cerrar notificación"
      >
        <XIcon size={20} />
      </button>
    </div>
  )
}
