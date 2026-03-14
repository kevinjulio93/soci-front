/**
 * ConfirmModal - Modal de confirmación reutilizable
 * Modal genérico para confirmar acciones destructivas
 */

import { useCallback, useMemo } from 'react'
import { AlertCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from './Icons'
import '../styles/Modal.scss'

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
  if (!isOpen) return null

  const handleConfirm = useCallback(() => {
    onConfirm()
  }, [onConfirm])

  const iconByVariant = useMemo(() => {
    switch (variant) {
      case 'danger':
        return <AlertCircleIcon size={48} />
      case 'warning':
        return <AlertTriangleIcon size={48} />
      case 'info':
        return <InfoIcon size={48} />
    }
  }, [variant])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--confirm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header modal-header--confirm">
          <div className="modal-header__title-group">
            <div className={`confirm-icon confirm-icon--${variant}`}>
              {iconByVariant}
            </div>
            <h2 className="modal-header__title">{title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} disabled={isLoading}>
            <XIcon size={24} />
          </button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn--secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn--danger' : 'btn--primary'}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
