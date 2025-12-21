import React from 'react'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  showQR: boolean
  qrImageUrl?: string
}

const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  showQR,
  qrImageUrl 
}) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--success" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content__header">
          <h2 className="modal-content__title">✓ Encuesta guardada con éxito</h2>
        </div>

        <div className="modal-content__body">
          {showQR && (
            <div className="whatsapp-qr">
              <p className="whatsapp-qr__message">¡Mantente conectado con nosotros!</p>
              {qrImageUrl ? (
                <div className="whatsapp-qr__image-container">
                  <img 
                    src={qrImageUrl} 
                    alt="Código QR de WhatsApp" 
                    className="whatsapp-qr__image"
                  />
                  <p className="whatsapp-qr__instruction">
                    ¡Escríbenos a nuestro WhatsApp y únete al grupo de tu región y mantente al día!
                  </p>
                </div>
              ) : (
                <div className="whatsapp-qr__placeholder">
                  <p>Código QR no disponible</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-content__footer">
          <button 
            className="btn btn--primary" 
            onClick={onClose}
          >
            Continuar al Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessModal
