/**
 * BatchAssignCoordinatorModal - Modal para asignar/desasignar coordinador en lote
 */

import { useState, useEffect } from 'react'
import { apiService } from '../services/api.service'
import { Select } from './Select'
import { Textarea } from './Textarea'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignación de Coordinador en Lote</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          <p><strong>{selectedSocializers.length}</strong> socializador(es) seleccionado(s):</p>
          <ul className="mt-1 list-disc pl-4 text-muted-foreground">
            {selectedSocializers.slice(0, 5).map((socializer) => (
              <li key={socializer._id}>{socializer.fullName}</li>
            ))}
            {selectedSocializers.length > 5 && (
              <li>... y {selectedSocializers.length - 5} más</li>
            )}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Acción */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Acción *</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  value="assign"
                  checked={action === 'assign'}
                  onChange={(e) => setAction(e.target.value as 'assign')}
                  disabled={isLoading}
                />
                Asignar Coordinador
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  value="unassign"
                  checked={action === 'unassign'}
                  onChange={(e) => setAction(e.target.value as 'unassign')}
                  disabled={isLoading}
                />
                Desasignar Coordinador
              </label>
            </div>
          </div>

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

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    disabled={isLoading}
                  />
                  Reemplazar asignaciones existentes
                </label>
                <p className="text-xs text-muted-foreground pl-5">
                  Si está marcado, desactivará las asignaciones actuales antes de crear las nuevas
                </p>
              </div>
            </>
          )}

          {action === 'unassign' && (
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={deleteRecords}
                  onChange={(e) => setDeleteRecords(e.target.checked)}
                  disabled={isLoading}
                />
                Eliminar registros de historial
              </label>
              <p className="text-xs text-muted-foreground pl-5">
                Si no está marcado, se mantendrá el historial de asignaciones
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedCoordinatorId}
            >
              {isLoading
                ? 'Procesando...'
                : action === 'assign'
                  ? 'Asignar'
                  : 'Desasignar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
