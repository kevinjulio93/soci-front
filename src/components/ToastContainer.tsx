/**
 * ToastContainer - Contenedor para mostrar múltiples toasts
 */

import { Toast, ToastProps } from './Toast'
import '../styles/Toast.scss'

interface ToastContainerProps {
  toasts: ToastProps[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}
