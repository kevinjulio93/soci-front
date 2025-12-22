/**
 * SurveyDetailModal - Modal para mostrar detalles completos de encuesta
 * Muestra toda la información del encuestado con reproducción de audio
 */

import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/Modal.scss'
import { RespondentData } from '../models/ApiResponses'
import { EXTERNAL_URLS, MAP_CONFIG } from '../constants'

interface SurveyDetailModalProps {
  isOpen: boolean
  onClose: () => void
  survey: RespondentData | null
  formatDate: (date: string) => string
}

// Fix para los iconos de Leaflet en Vite/Webpack
const defaultIcon = new Icon({
  iconUrl: EXTERNAL_URLS.LEAFLET_MARKER_ICON,
  iconRetinaUrl: EXTERNAL_URLS.LEAFLET_MARKER_ICON_2X,
  shadowUrl: EXTERNAL_URLS.LEAFLET_MARKER_SHADOW,
  iconSize: MAP_CONFIG.MARKER_SIZE,
  iconAnchor: MAP_CONFIG.MARKER_ANCHOR,
  popupAnchor: MAP_CONFIG.POPUP_ANCHOR,
  shadowSize: MAP_CONFIG.SHADOW_SIZE
})

// Icono rojo para encuestas no exitosas
const redIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: EXTERNAL_URLS.LEAFLET_MARKER_SHADOW,
  iconSize: MAP_CONFIG.MARKER_SIZE,
  iconAnchor: MAP_CONFIG.MARKER_ANCHOR,
  popupAnchor: MAP_CONFIG.POPUP_ANCHOR,
  shadowSize: MAP_CONFIG.SHADOW_SIZE
})

export function SurveyDetailModal({
  isOpen,
  onClose,
  survey,
  formatDate,
}: SurveyDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [audioDuration, setAudioDuration] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Limpiar y resetear estado cuando cambia la encuesta o se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      // Limpiar audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      // Resetear estados
      setIsPlaying(false)
      setAudioError(false)
    }
  }, [isOpen])

  // Resetear estados cuando cambia la encuesta
  useEffect(() => {
    if (isOpen && survey) {
      // Detener audio anterior si está reproduciendo
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      // Resetear estados para la nueva encuesta
      setIsPlaying(false)
      setAudioError(false)
      setAudioDuration(null)
      
      // Cargar metadata del audio para obtener la duración
      if (survey.audioUrl) {
        const audio = new Audio(survey.audioUrl)
        audio.addEventListener('loadedmetadata', () => {
          setAudioDuration(audio.duration)
        })
        audio.addEventListener('error', () => {
          setAudioError(true)
        })
      }
    }
  }, [survey, isOpen])

  if (!isOpen || !survey) return null

  // Determinar si la encuesta fue exitosa
  const isSuccessful = survey.surveyStatus === 'successful'
  
  // Obtener la razón de rechazo
  const getRejectionReason = () => {
    if (survey.noResponseReason?.label) return survey.noResponseReason.label
    if (survey.rejectionReason?.label) return survey.rejectionReason.label
    if (typeof survey.noResponseReason === 'string') return survey.noResponseReason
    if (typeof survey.rejectionReason === 'string') return survey.rejectionReason
    return 'No especificada'
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
          audioRef.current.addEventListener('loadedmetadata', () => {
            if (audioRef.current) {
              setAudioDuration(audioRef.current.duration)
            }
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
          {!isSuccessful ? (
            // Vista simplificada para encuestas no exitosas
            <>
              {/* Razón de No Respuesta */}
              <section className="detail-section">
                <h3 className="detail-section__title">Razón de No Respuesta</h3>
                <div className="detail-grid">
                  <div className="detail-item detail-item--full">
                    <span className="detail-item__label">Motivo:</span>
                    <span className="detail-item__value detail-item__value--highlight">
                      {getRejectionReason()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-item__label">Fecha de Registro:</span>
                    <span className="detail-item__value">{formatDate(survey.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-item__label">Autor:</span>
                    <span className="detail-item__value">
                      {typeof survey.autor === 'string' ? survey.autor : survey.autor?.email || 'N/A'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Ubicación Geográfica */}
              {survey.location && survey.location.coordinates && survey.location.coordinates[0] !== 0 && survey.location.coordinates[1] !== 0 && (
                <section className="detail-section">
                  <h3 className="detail-section__title">Ubicación del Intento</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-item__label">Longitud:</span>
                      <span className="detail-item__value">{survey.location.coordinates[0].toFixed(6)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-item__label">Latitud:</span>
                      <span className="detail-item__value">{survey.location.coordinates[1].toFixed(6)}</span>
                    </div>
                    <div className="detail-item detail-item--full detail-item--map">
                      <span className="detail-item__label">Mapa de Ubicación:</span>
                      <div className="map-container">
                        <MapContainer
                          center={[survey.location.coordinates[1], survey.location.coordinates[0]]}
                          zoom={15}
                          style={{ height: '250px', width: '100%', borderRadius: '8px' }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker 
                            position={[survey.location.coordinates[1], survey.location.coordinates[0]]}
                            icon={redIcon}
                          >
                            <Popup>
                              <strong>Encuesta no realizada</strong>
                              <br />
                              <em>{getRejectionReason()}</em>
                            </Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          ) : (
            // Vista completa para encuestas exitosas
            <>
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

          {/* Ubicación Geográfica */}
          {survey.location && survey.location.coordinates && survey.location.coordinates[0] !== 0 && survey.location.coordinates[1] !== 0 && (
            <section className="detail-section">
              <h3 className="detail-section__title">Ubicación Geográfica</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-item__label">Longitud:</span>
                  <span className="detail-item__value">{survey.location.coordinates[0].toFixed(6)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Latitud:</span>
                  <span className="detail-item__value">{survey.location.coordinates[1].toFixed(6)}</span>
                </div>
                <div className="detail-item detail-item--full detail-item--map">
                  <span className="detail-item__label">Mapa de Ubicación:</span>
                  <div className="map-container">
                    <MapContainer
                      center={[survey.location.coordinates[1], survey.location.coordinates[0]]}
                      zoom={15}
                      style={{ height: '250px', width: '100%', borderRadius: '8px' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker 
                        position={[survey.location.coordinates[1], survey.location.coordinates[0]]}
                        icon={defaultIcon}
                      >
                        <Popup>
                          <strong>{survey.fullName}</strong>
                          <br />
                          {survey.neighborhood && `${survey.neighborhood}, `}
                          {survey.city}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              </div>
            </section>
          )}

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
                    {audioDuration !== null && (
                      <span className="audio-control__duration">
                        Duración: {formatDuration(audioDuration)}
                      </span>
                    )}
                    {audioError && (
                      <span className="audio-control__error">Error al cargar audio</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
            </>
          )}
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
