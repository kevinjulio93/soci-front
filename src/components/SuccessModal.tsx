import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  showQR: boolean
  qrImageUrl?: string
  /** Indica si se está guardando la encuesta en background */
  isFinalizing?: boolean
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  showQR,
  qrImageUrl,
  isFinalizing = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isFinalizing && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-green-600">✓ Encuesta guardada con éxito</DialogTitle>
        </DialogHeader>

        {showQR && (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-center text-muted-foreground">¡Mantente conectado con nosotros!</p>
            {qrImageUrl ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={qrImageUrl}
                  alt="Código QR de WhatsApp"
                  className="w-40 h-40 rounded-lg object-contain"
                />
                <p className="text-xs text-center text-muted-foreground">
                  ¡Escríbenos a nuestro WhatsApp y únete al grupo de tu región y mantente al día!
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Código QR no disponible</p>
            )}
          </div>
        )}

        <DialogFooter className="flex-col">
          {isFinalizing && (
            <p className="text-xs text-center text-muted-foreground w-full">
              Terminando de guardar la encuesta...
            </p>
          )}
          <Button className="w-full" onClick={onClose} disabled={isFinalizing}>
            {isFinalizing ? 'Terminando de guardar...' : 'Continuar al Dashboard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SuccessModal
