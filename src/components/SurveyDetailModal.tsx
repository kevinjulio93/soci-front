/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SurveyDetailModal - Modal para mostrar detalles completos de encuesta
 * Muestra toda la información del encuestado con reproducción de audio
 */

import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b pr-12 flex-shrink-0">
          <DialogTitle>Detalle de Encuesta</DialogTitle>
          {!loading && survey && (
            <>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                isSuccessful ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'
              }`}>
                {isSuccessful ? 'Exitosa' : 'No Exitosa'}
              </span>
              {survey.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  <CheckIcon size={12} strokeWidth={3} />
                  Verificada
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  <XIcon size={12} strokeWidth={3} />
                  No Verificada
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-sm">Cargando detalles de la encuesta...</p>
            </div>
          ) : !survey ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <p>No se pudo cargar la información de la encuesta.</p>
            </div>
          ) : (
            <>
              {!isSuccessful ? (
                // Vista simplificada para encuestas no exitosas
                <>
                  {/* Razón de No Respuesta */}
                  <section className="mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b mb-3">Razón de No Respuesta</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-0.5 sm:col-span-2">
                        <span className="text-xs text-muted-foreground">Motivo:</span>
                        <span className="text-sm font-bold text-destructive">
                          {getRejectionReason()}
                        </span>
                      </div>

                      {survey.socializer && (
                        <>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Socializador:</span>
                            <span className="text-sm font-medium">{survey.socializer.fullName}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Teléfono Socializador:</span>
                            <span className="text-sm font-medium">{survey.socializer.phone}</span>
                          </div>
                        </>
                      )}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Autor:</span>
                        <span className="text-sm font-medium">
                          {typeof survey.autor === 'string' ? survey.autor : survey.autor?.email || 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Fecha de Registro:</span>
                        <span className="text-sm font-medium">{formatDate(survey.createdAt)}</span>
                      </div>
                    </div>
                  </section>

                  {/* Ubicación Geográfica */}
                  {survey.location && survey.location.coordinates && survey.location.coordinates[0] !== 0 && survey.location.coordinates[1] !== 0 && (
                    <section className="mb-6">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b mb-3">Ubicación del Intento</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Longitud:</span>
                          <span className="text-sm font-medium">{survey.location.coordinates[0].toFixed(6)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Latitud:</span>
                          <span className="text-sm font-medium">{survey.location.coordinates[1].toFixed(6)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 sm:col-span-2">
                          <span className="text-xs text-muted-foreground">Mapa de Ubicación:</span>
                          <div className="rounded-lg overflow-hidden">
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

                  {/* Audio de la encuesta no exitosa */}
                  {survey.audioUrl && (
                    <section className="mb-6">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b mb-3">Audio de Encuesta</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-0.5 sm:col-span-2">
                          <div className="rounded-lg bg-muted/40 p-3 flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                className={`flex items-center justify-center w-8 h-8 rounded-full transition disabled:opacity-50 ${isPlaying ? "bg-primary/90 text-primary-foreground" : "bg-primary text-primary-foreground"}`}
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
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground transition disabled:opacity-50"
                                onClick={handleStopAudio}
                                disabled={audioError || (!isPlaying && audioCurrentTime === 0)}
                                title="Detener"
                              >
                                <StopIcon size={16} fill="currentColor" stroke="none" />
                              </button>
                            </div>

                            <div className="flex-1 flex flex-col gap-1">
                              <div
                                className="relative h-2 rounded-full bg-muted cursor-pointer overflow-hidden"
                                onClick={handleSeek}
                                title="Clic para buscar"
                              >
                                <div
                                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                                  style={{ width: audioDuration && isFinite(audioDuration) ? `${(audioCurrentTime / audioDuration) * 100}%` : '0%' }}
                                />
                                {audioDuration && isFinite(audioDuration) ? (
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary -translate-x-1/2"
                                    style={{ left: `${(audioCurrentTime / audioDuration) * 100}%` }}
                                  />
                                ) : null}
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{formatDuration(audioCurrentTime)}</span>
                                <span>{formatDuration(audioDuration)}</span>
                              </div>
                            </div>

                            {isPlaying && (
                              <div className="flex items-center gap-0.5">
                                <span /><span /><span /><span /><span />
                              </div>
                            )}

                            {audioError && (
                              <span className="text-xs text-destructive">Error al cargar audio</span>
                            )}
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
                  <section className="mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b mb-3">Información Personal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Nombre Completo:</span>
                        <span className="text-sm font-medium">{survey.fullName}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Tipo de Identificación:</span>
                        <span className="text-sm font-medium">{survey.idType || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Número de Identificación:</span>
                        <span className="text-sm font-medium">{survey.identification}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Género:</span>
                        <span className="text-sm font-medium">{survey.gender}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Rango de Edad:</span>
                        <span className="text-sm font-medium">{survey.ageRange}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Defensor de la Patria:</span>
                        <span className="text-sm font-medium">
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
                  <section className="mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b mb-3">Información de Contacto</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Teléfono:</span>
                        <span className="text-sm font-medium">{survey.phone || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Correo Electrónico:</span>
                        <span className="text-sm font-medium">{survey.email || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:col-span-2">
                        <span className="text-xs text-muted-foreground">Dirección:</span>
                        <span className="text-sm font-medium">{survey.address || 'N/A'}</span>
                      </div>
                    </div>
                  </section>

                  {/* Información de Ubicación */}
                  <section className="mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b mb-3">Información de Ubicación</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Departamento:</span>
                        <span className="text-sm font-medium">{getStringValue(survey.department) || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Municipio:</span>
                        <span className="text-sm font-medium">{getStringValue(survey.city) || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Barrio:</span>
                        <span className="text-sm font-medium">{survey.neighborhood || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Estrato:</span>
                        <span className="text-sm font-medium">{survey.stratum || 'N/A'}</span>
                      </div>
                    </div>
                  </section>

                  {/* Ubicación Geográfica */}
                  {survey.location && survey.location.coordinates && survey.location.coordinates[0] !== 0 && survey.location.coordinates[1] !== 0 && (
                    <section className="mb-6">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b mb-3">Ubicación Geográfica</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Longitud:</span>
                          <span className="text-sm font-medium">{survey.location.coordinates[0].toFixed(6)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Latitud:</span>
                          <span className="text-sm font-medium">{survey.location.coordinates[1].toFixed(6)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 sm:col-span-2">
                          <span className="text-xs text-muted-foreground">Mapa de Ubicación:</span>
                          <div className="rounded-lg overflow-hidden">
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
                  <section className="mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b mb-3">Información Adicional</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      {survey.socializer && (
                        <>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Socializador:</span>
                            <span className="text-sm font-medium">{survey.socializer.fullName}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Teléfono Socializador:</span>
                            <span className="text-sm font-medium">{survey.socializer.phone}</span>
                          </div>
                        </>
                      )}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Autor:</span>
                        <span className="text-sm font-medium">
                          {typeof survey.autor === 'string' ? survey.autor : survey.autor?.email || 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">Fecha de Registro:</span>
                        <span className="text-sm font-medium">{formatDate(survey.createdAt)}</span>
                      </div>
                      {survey.audioUrl && (
                        <div className="flex flex-col gap-0.5 sm:col-span-2">
                          <span className="text-xs text-muted-foreground">Audio de Encuesta:</span>
                          <div className="rounded-lg bg-muted/40 p-3 flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                className={`flex items-center justify-center w-8 h-8 rounded-full transition disabled:opacity-50 ${isPlaying ? "bg-primary/90 text-primary-foreground" : "bg-primary text-primary-foreground"}`}
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
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground transition disabled:opacity-50"
                                onClick={handleStopAudio}
                                disabled={audioError || (!isPlaying && audioCurrentTime === 0)}
                                title="Detener"
                              >
                                <StopIcon size={16} fill="currentColor" stroke="none" />
                              </button>
                            </div>

                            <div className="flex-1 flex flex-col gap-1">
                              <div
                                className="relative h-2 rounded-full bg-muted cursor-pointer overflow-hidden"
                                onClick={handleSeek}
                                title="Clic para buscar"
                              >
                                <div
                                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                                  style={{ width: audioDuration && isFinite(audioDuration) ? `${(audioCurrentTime / audioDuration) * 100}%` : '0%' }}
                                />
                                {audioDuration && isFinite(audioDuration) ? (
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary -translate-x-1/2"
                                    style={{ left: `${(audioCurrentTime / audioDuration) * 100}%` }}
                                  />
                                ) : null}
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{formatDuration(audioCurrentTime)}</span>
                                <span>{formatDuration(audioDuration)}</span>
                              </div>
                            </div>

                            {isPlaying && (
                              <div className="flex items-center gap-0.5">
                                <span /><span /><span /><span /><span />
                              </div>
                            )}

                            {audioError && (
                              <span className="text-xs text-destructive">Error al cargar audio</span>
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

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
