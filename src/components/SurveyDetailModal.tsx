/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { apiService } from '../services/api.service'
import { CheckIcon, XIcon, PlayIcon, PauseIcon, StopIcon } from './Icons'
import { notificationService } from '../services/notification.service'

interface SurveyDetailModalProps {
  isOpen: boolean
  onClose: () => void
  surveyId: string | null
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
  surveyId,
  formatDate,
}: SurveyDetailModalProps) {
  const [survey, setSurvey] = useState<RespondentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)

  // Helper function to extract string value from either string or object
  const getStringValue = (value: unknown): string => {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value !== null && 'name' in value) {
      return (value as { name: string }).name
    }
    return 'N/A'
  }
  const [audioDuration, setAudioDuration] = useState<number | null>(null)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Limpiar y resetear estado cuando cambia la encuesta o se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      // Limpiar audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      // Resetear estados
      setIsPlaying(false)
      setAudioError(false)
      setAudioCurrentTime(0)
    }
  }, [isOpen])

  // Cargar datos de la encuesta
  useEffect(() => {
    const fetchSurvey = async () => {
      if (isOpen && surveyId) {
        try {
          setLoading(true)
          const response = await apiService.getRespondentById(surveyId)
          if (response.data) {
            setSurvey(response.data)
          }
        } catch (error) {
          notificationService.handleApiError(error, 'Error al cargar los detalles de la encuesta')
          onClose()
        } finally {
          setLoading(false)
        }
      } else if (!isOpen) {
        setSurvey(null)
      }
    }

    fetchSurvey()
  }, [surveyId, isOpen, onClose])

  // Resetear estados cuando cambia la encuesta
  useEffect(() => {
    if (isOpen && survey) {
      // Detener audio anterior si está reproduciendo
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      // Resetear estados para la nueva encuesta
      setIsPlaying(false)
      setAudioError(false)
      setAudioDuration(null)
      setAudioCurrentTime(0)

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

  if (!isOpen) return null

  // Determinar si la encuesta fue exitosa
  const isSuccessful = survey?.surveyStatus === 'successful'

  // Obtener la razón de rechazo
  const getRejectionReason = () => {
    if (!survey) return 'No especificada'
    if (typeof survey.noResponseReason === 'object' && (survey.noResponseReason as any).label) return (survey.noResponseReason as any).label
    if (typeof survey.rejectionReason === 'object' && (survey.rejectionReason as any).label) return (survey.rejectionReason as any).label
    if (typeof survey.noResponseReason === 'string') return survey.noResponseReason
    if (typeof survey.rejectionReason === 'string') return survey.rejectionReason
    return 'No especificada'
  }

  const formatDuration = (seconds: number | null | undefined): string => {
    if (seconds === null || seconds === undefined || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayAudio = async () => {
    if (!survey?.audioUrl) {
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
            setAudioCurrentTime(0)
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
          audioRef.current.addEventListener('timeupdate', () => {
            if (audioRef.current) {
              setAudioCurrentTime(audioRef.current.currentTime)
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

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    setIsPlaying(false)
    setAudioCurrentTime(0)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    const newTime = pct * audioDuration
    audioRef.current.currentTime = newTime
    setAudioCurrentTime(newTime)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--detail" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header__content">
            <h2 className="modal-title">Detalle de Encuesta</h2>
            {!loading && survey && (
              <>
                <span className={`modal-badge ${isSuccessful ? 'modal-badge--success' : 'modal-badge--danger'}`}>
                  {isSuccessful ? 'Exitosa' : 'No Exitosa'}
                </span>
                {survey.isVerified ? (
                  <span className="modal-badge modal-badge--verified">
                    <CheckIcon size={16} style={{ marginRight: '4px' }} strokeWidth={3} />
                    Verificada
                  </span>
                ) : (
                  <span className="modal-badge modal-badge--not-verified">
                    <XIcon size={16} style={{ marginRight: '4px' }} strokeWidth={3} />
                    No Verificada
                  </span>
                )}
              </>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>
            <XIcon size={24} />
          </button>
        </div>

        <div className="modal-body modal-body--detail">
          {loading ? (
            <div className="modal-loading">
              <div className="modal-loading__spinner"></div>
              <p>Cargando detalles de la encuesta...</p>
            </div>
          ) : !survey ? (
            <div className="modal-error">
              <p>No se pudo cargar la información de la encuesta.</p>
            </div>
          ) : (
            <>
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
                      {survey.socializer && (
                        <>
                          <div className="detail-item">
                            <span className="detail-item__label">Socializador:</span>
                            <span className="detail-item__value">{survey.socializer.fullName}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-item__label">Teléfono Socializador:</span>
                            <span className="detail-item__value">{survey.socializer.phone}</span>
                          </div>
                        </>
                      )}
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
                      <div className="detail-item">
                        <span className="detail-item__label">Defensor de la Patria:</span>
                        <span className="detail-item__value">
                          {(survey as any).isPatriaDefender ? (
                            <span style={{ color: '#28a745', fontWeight: 600 }}>✓ Sí</span>
                          ) : (
                            <span style={{ color: '#6c757d' }}>✗ No</span>
                          )}
                        </span>
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
                        <span className="detail-item__label">Departamento:</span>
                        <span className="detail-item__value">{getStringValue(survey.department) || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-item__label">Municipio:</span>
                        <span className="detail-item__value">{getStringValue(survey.city) || 'N/A'}</span>
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
                                  {getStringValue(survey.city)}
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
                      {survey.socializer && (
                        <>
                          <div className="detail-item">
                            <span className="detail-item__label">Socializador:</span>
                            <span className="detail-item__value">{survey.socializer.fullName}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-item__label">Teléfono Socializador:</span>
                            <span className="detail-item__value">{survey.socializer.phone}</span>
                          </div>
                        </>
                      )}
                      <div className="detail-item">
                        <span className="detail-item__label">Fecha de Registro:</span>
                        <span className="detail-item__value">{formatDate(survey.createdAt)}</span>
                      </div>
                      {survey.audioUrl && (
                        <div className="detail-item detail-item--full">
                          <span className="detail-item__label">Audio de Encuesta:</span>
                          <div className="audio-player">
                            <div className="audio-player__controls">
                              <button
                                className={`audio-player__btn audio-player__btn--play ${isPlaying ? 'audio-player__btn--playing' : ''}`}
                                onClick={handlePlayAudio}
                                disabled={audioError}
                                title={isPlaying ? 'Pausar' : 'Reproducir'}
                              >
                                {isPlaying ? (
                                  <PauseIcon size={18} fill="currentColor" stroke="none" />
                                ) : (
                                  <PlayIcon size={18} fill="currentColor" stroke="none" />
                                )}
                              </button>
                              <button
                                className="audio-player__btn audio-player__btn--stop"
                                onClick={handleStopAudio}
                                disabled={audioError || (!isPlaying && audioCurrentTime === 0)}
                                title="Detener"
                              >
                                <StopIcon size={16} fill="currentColor" stroke="none" />
                              </button>
                            </div>

                            <div className="audio-player__track">
                              <div
                                className="audio-player__progress-bar"
                                onClick={handleSeek}
                                title="Clic para buscar"
                              >
                                <div
                                  className="audio-player__progress-fill"
                                  style={{ width: audioDuration && isFinite(audioDuration) ? `${(audioCurrentTime / audioDuration) * 100}%` : '0%' }}
                                />
                                {audioDuration && isFinite(audioDuration) ? (
                                  <div
                                    className="audio-player__progress-thumb"
                                    style={{ left: `${(audioCurrentTime / audioDuration) * 100}%` }}
                                  />
                                ) : null}
                              </div>
                              <div className="audio-player__time">
                                <span>{formatDuration(audioCurrentTime)}</span>
                                <span>{formatDuration(audioDuration)}</span>
                              </div>
                            </div>

                            {isPlaying && (
                              <div className="audio-player__visualizer">
                                <span /><span /><span /><span /><span />
                              </div>
                            )}

                            {audioError && (
                              <span className="audio-player__error">Error al cargar audio</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
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
