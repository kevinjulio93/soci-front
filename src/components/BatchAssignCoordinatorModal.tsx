/**
 * BatchAssignCoordinatorModal - Modal para asignar/desasignar coordinador en lote
 */

import { useState, useEffect } from 'react'
import { apiService } from '../services/api.service'
import { Select } from './Select'
import { Textarea } from './Textarea'
import '../styles/Modal.scss'

interface BatchAssignCoordinatorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  selectedSocializers: Array<{
    _id: string
    fullName: string
    role: string
  }>
}

export function BatchAssignCoordinatorModal({
  isOpen,
  onClose,
  onSuccess,
  selectedSocializers,
}: BatchAssignCoordinatorModalProps) {
  const [coordinators, setCoordinators] = useState<Array<{
    _id: string
    fullName: string
    email: string
  }>>([])
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('')
  const [action, setAction] = useState<'assign' | 'unassign'>('assign')
  const [notes, setNotes] = useState('')
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [deleteRecords, setDeleteRecords] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadCoordinators()
    }
  }, [isOpen])

  const loadCoordinators = async () => {
    try {
      const response = await apiService.getCoordinators()
      setCoordinators(response)
    } catch (err) {
      setError('Error al cargar coordinadores')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (action === 'assign' && !selectedCoordinatorId) {
      setError('Debe seleccionar un coordinador')
      return
    }

    if (action === 'unassign' && !selectedCoordinatorId) {
      setError('Debe seleccionar un coordinador para desasignar')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const socializerIds = selectedSocializers.map(s => s._id)

      if (action === 'assign') {
        await apiService.batchAssignCoordinator({
          coordinatorId: selectedCoordinatorId,
          socializerIds,
          notes: notes || undefined,
          replaceExisting,
        })
      } else {
        await apiService.batchUnassignCoordinator({
          coordinatorId: selectedCoordinatorId,
          socializerIds,
          deleteRecords,
        })
      }

      onSuccess()
      handleClose()
    } catch (err) {
      setError(
        action === 'assign'
          ? 'Error al asignar coordinador'
          : 'Error al desasignar coordinador'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedCoordinatorId('')
    setAction('assign')
    setNotes('')
    setReplaceExisting(true)
    setDeleteRecords(false)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-header__title">
            Asignación de Coordinador en Lote
          </h2>
          <button
            className="modal-header__close"
            onClick={handleClose}
            type="button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
              <p>{error}</p>
            </div>
          )}

          <div className="batch-assign-info">
            <p className="batch-assign-info__text">
              <strong>{selectedSocializers.length}</strong> socializador(es) seleccionado(s):
            </p>
            <ul className="batch-assign-info__list">
              {selectedSocializers.slice(0, 5).map((socializer) => (
                <li key={socializer._id}>{socializer.fullName}</li>
              ))}
              {selectedSocializers.length > 5 && (
                <li>... y {selectedSocializers.length - 5} más</li>
              )}
            </ul>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Acción */}
            <div className="form-group">
              <label className="form-group__label">Acción *</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="assign"
                    checked={action === 'assign'}
                    onChange={(e) => setAction(e.target.value as 'assign')}
                    disabled={isLoading}
                  />
                  <span>Asignar Coordinador</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="unassign"
                    checked={action === 'unassign'}
                    onChange={(e) => setAction(e.target.value as 'unassign')}
                    disabled={isLoading}
                  />
                  <span>Desasignar Coordinador</span>
                </label>
              </div>
            </div>

            {/* Coordinador */}
            <Select
              id="coordinator"
              label="Coordinador"
              placeholder={action === 'assign' ? 'Seleccione un coordinador' : 'Seleccione coordinador a desasignar'}
              options={coordinators.map((coordinator) => ({
                value: coordinator._id,
                label: `${coordinator.fullName} - ${coordinator.email}`,
              }))}
              value={selectedCoordinatorId}
              onChange={(e) => setSelectedCoordinatorId(e.target.value)}
              disabled={isLoading}
              required
            />

            {/* Opciones para Asignar */}
            {action === 'assign' && (
              <>
                <Textarea
                  id="notes"
                  label="Notas (opcional)"
                  placeholder="Ej: Reorganización 2025"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />

                <div className="form-group">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span>Reemplazar asignaciones existentes</span>
                  </label>
                  <p className="form-group__hint">
                    Si está marcado, desactivará las asignaciones actuales antes de crear las nuevas
                  </p>
                </div>
              </>
            )}

            {/* Opciones para Desasignar */}
            {action === 'unassign' && (
              <div className="form-group">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={deleteRecords}
                    onChange={(e) => setDeleteRecords(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>Eliminar registros de historial</span>
                </label>
                <p className="form-group__hint">
                  Si no está marcado, se mantendrá el historial de asignaciones
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isLoading || !selectedCoordinatorId}
              >
                {isLoading
                  ? 'Procesando...'
                  : action === 'assign'
                  ? 'Asignar'
                  : 'Desasignar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
