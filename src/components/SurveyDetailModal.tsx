/**
 * SurveyDetailModal - Modal para mostrar detalles completos de encuesta
 * Muestra toda la información del encuestado con reproducción de audio
 */

import { useState, useRef, useEffect } from 'react'
import '../styles/Modal.scss'
import { RespondentData } from '../models/ApiResponses'

interface SurveyDetailModalProps {
  isOpen: boolean
  onClose: () => void
  survey: RespondentData | null
  formatDate: (date: string) => string
}

export function SurveyDetailModal({
  isOpen,
  onClose,
  survey,
  formatDate,
}: SurveyDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Limpiar audio al cerrar
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setIsPlaying(false)
    }
  }, [isOpen])

  if (!isOpen || !survey) return null

  const handlePlayAudio = async () => {
    if (!survey.audioUrl) {
      setAudioError(true)
      return
    }

    try {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        if (!audioRef.current) {
          audioRef.current = new Audio(survey.audioUrl)
          audioRef.current.addEventListener('ended', () => {
            setIsPlaying(false)
          })
          audioRef.current.addEventListener('error', () => {
            setAudioError(true)
            setIsPlaying(false)
          })
        }
        await audioRef.current.play()
        setIsPlaying(true)
        setAudioError(false)
      }
    } catch (error) {
      setAudioError(true)
      setIsPlaying(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--detail" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Detalle de Encuesta</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body modal-body--detail">
          {/* Información Personal */}
          <section className="detail-section">
            <h3 className="detail-section__title">Información Personal</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-item__label">Nombre Completo:</span>
                <span className="detail-item__value">{survey.fullName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Tipo de Identificación:</span>
                <span className="detail-item__value">{survey.idType || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Número de Identificación:</span>
                <span className="detail-item__value">{survey.identification}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Género:</span>
                <span className="detail-item__value">{survey.gender}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Rango de Edad:</span>
                <span className="detail-item__value">{survey.ageRange}</span>
              </div>
            </div>
          </section>

          {/* Información de Contacto */}
          <section className="detail-section">
            <h3 className="detail-section__title">Información de Contacto</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-item__label">Teléfono:</span>
                <span className="detail-item__value">{survey.phone || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Correo Electrónico:</span>
                <span className="detail-item__value">{survey.email || 'N/A'}</span>
              </div>
              <div className="detail-item detail-item--full">
                <span className="detail-item__label">Dirección:</span>
                <span className="detail-item__value">{survey.address || 'N/A'}</span>
              </div>
            </div>
          </section>

          {/* Información de Ubicación */}
          <section className="detail-section">
            <h3 className="detail-section__title">Información de Ubicación</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-item__label">Región:</span>
                <span className="detail-item__value">{survey.region || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Departamento:</span>
                <span className="detail-item__value">{survey.department || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Ciudad:</span>
                <span className="detail-item__value">{survey.city || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Barrio:</span>
                <span className="detail-item__value">{survey.neighborhood || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Estrato:</span>
                <span className="detail-item__value">{survey.stratum || 'N/A'}</span>
              </div>
            </div>
          </section>

          {/* Audio e Información Adicional */}
          <section className="detail-section">
            <h3 className="detail-section__title">Información Adicional</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-item__label">Autor:</span>
                <span className="detail-item__value">
                  {typeof survey.autor === 'string' ? survey.autor : survey.autor?.email || 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Fecha de Registro:</span>
                <span className="detail-item__value">{formatDate(survey.createdAt)}</span>
              </div>
              {survey.audioUrl && (
                <div className="detail-item detail-item--full">
                  <span className="detail-item__label">Audio de Encuesta:</span>
                  <div className="audio-control">
                    <button
                      className="audio-control__btn"
                      onClick={handlePlayAudio}
                      disabled={audioError}
                      title={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
                    >
                      {isPlaying ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>
                    {audioError && (
                      <span className="audio-control__error">Error al cargar audio</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
