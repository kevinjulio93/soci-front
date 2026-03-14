/**
 * LocationModal - Modal para visualizar ubicación en mapa
 * Muestra la ubicación en tiempo real de un socializador
 */

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import { apiService } from '../services/api.service'
import { EXTERNAL_URLS, MAP_CONFIG, MESSAGES, LOCALE_CONFIG } from '../constants'
import { RefreshIcon, XIcon, ExternalLinkIcon } from './Icons'
import 'leaflet/dist/leaflet.css'
import '../styles/Modal.scss'

interface LocationData {
  lat: number
  long: number
  timestamp?: string
  accuracy?: number
}

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  socializerName: string
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

export function LocationModal({ isOpen, onClose, userId, socializerName }: LocationModalProps) {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLocation = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiService.getLatestLocation(userId)
      setLocation({
        lat: response.lat,
        long: response.long,
        timestamp: response.timestamp,
        accuracy: response.accuracy,
      })
    } catch (err) {
      setError(MESSAGES.LOCATION_LOAD_ERROR)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && userId) {
      loadLocation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId])

  const handleRefresh = () => {
    loadLocation()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return MESSAGES.NO_DATA
    return new Date(dateString).toLocaleString(LOCALE_CONFIG.DEFAULT_LOCALE, LOCALE_CONFIG.DATE_FORMAT)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Ubicación de {socializerName}</h2>
          <div className="modal-header__actions">
            <button
              className="action-btn action-btn--location"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Actualizar ubicación"
            >
              <RefreshIcon size={20} />
            </button>
            <button className="modal-close" onClick={onClose}>
              <XIcon size={24} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {isLoading && (
            <div className="location-loading">
              <div className="spinner"></div>
              <p>Cargando ubicación...</p>
            </div>
          )}

          {error && (
            <div className="alert alert--error">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && location && (
            <>
              <div className="location-info">
                <div className="location-info__item">
                  <span className="location-info__label">{MESSAGES.LABEL_LATITUDE}:</span>
                  <span className="location-info__value">{location.lat.toFixed(6)}</span>
                </div>
                <div className="location-info__item">
                  <span className="location-info__label">{MESSAGES.LABEL_LONGITUDE}:</span>
                  <span className="location-info__value">{location.long.toFixed(6)}</span>
                </div>
                {location.accuracy && (
                  <div className="location-info__item">
                    <span className="location-info__label">{MESSAGES.LABEL_ACCURACY}:</span>
                    <span className="location-info__value">{location.accuracy}m</span>
                  </div>
                )}
                <div className="location-info__item">
                  <span className="location-info__label">{MESSAGES.LABEL_LAST_UPDATE}:</span>
                  <span className="location-info__value">{formatDate(location.timestamp)}</span>
                </div>
              </div>

              <div className="location-map">
                <MapContainer
                  center={[location.lat, location.long]}
                  zoom={MAP_CONFIG.DEFAULT_ZOOM}
                  style={{ height: MAP_CONFIG.MAP_HEIGHT, width: '100%' }}
                >
                  <TileLayer
                    attribution={EXTERNAL_URLS.LEAFLET_ATTRIBUTION}
                    url={EXTERNAL_URLS.LEAFLET_TILE_URL}
                  />
                  <Marker position={[location.lat, location.long]} icon={defaultIcon}>
                    <Popup>
                      <strong>{socializerName}</strong>
                      <br />
                      {formatDate(location.timestamp)}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div className="location-actions">
                <a
                  href={EXTERNAL_URLS.GOOGLE_MAPS_QUERY(location.lat, location.long)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--secondary"
                >
                  <ExternalLinkIcon size={16} />
                  {MESSAGES.TOOLTIP_OPEN_MAPS}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
