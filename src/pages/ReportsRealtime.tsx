/**
 * ReportsRealtime - Ubicación en tiempo real de socializadores
 * Muestra un mapa con las ubicaciones actuales de todos los socializadores
 */

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Sidebar } from '../components'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { useAuth } from '../contexts/AuthContext'
import { EXTERNAL_URLS, MAP_CONFIG, MESSAGES, LOCALE_CONFIG, SYNC_CONFIG } from '../constants'
import 'leaflet/dist/leaflet.css'
import '../styles/Dashboard.scss'

interface SocializerLocation {
  _id: string
  fullName: string
  idNumber: string
  user: {
    _id: string
    email: string
  }
  coordinator?: {
    _id: string
    fullName: string
    idNumber: string
    user: string  // ID del usuario del coordinador
  }
  latestLocation?: {
    coordinates: [number, number]
    latitude: number
    longitude: number
    accuracy: number
    timestamp: string
    speed?: number
    heading?: number
  }
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

export default function ReportsRealtime() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [socializers, setSocializers] = useState<SocializerLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSocializers()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadSocializers, SYNC_CONFIG.AUTO_SYNC_INTERVAL)
    
    return () => clearInterval(interval)
  }, [])

  const loadSocializers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiService.getSocializersWithLocations()
      
      // El endpoint ya devuelve solo socializadores con ubicaciones
      let socializersList = response.data || []
      
      // Si el usuario es coordinador, filtrar solo sus socializadores asignados
      const userRole = user?.role?.role?.toLowerCase()
      if (userRole === 'coordinador' || userRole === 'coordinator') {
        socializersList = socializersList.filter((s: SocializerLocation) => 
          s.coordinator && s.coordinator.user === user?.id
        )
      }
      
      setSocializers(socializersList)
    } catch (err) {
      notificationService.handleApiError(err, MESSAGES.LOCATION_LOAD_ERROR)
      setError(MESSAGES.LOCATION_LOAD_ERROR)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return MESSAGES.NO_DATA
    
    const date = new Date(dateString)
    return date.toLocaleString(LOCALE_CONFIG.DEFAULT_LOCALE, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const socializersWithLocation = socializers.filter(s => 
    s.latestLocation && 
    s.latestLocation.latitude != null && 
    s.latestLocation.longitude != null &&
    s.latestLocation.latitude !== 0 &&
    s.latestLocation.longitude !== 0
  )
  const socializersWithoutLocation = socializers.filter(s => !s.latestLocation)

  // Calcular el centro del mapa basado en las ubicaciones actuales
  const getMapCenter = (): [number, number] => {
    if (socializersWithLocation.length === 0) {
      return [4.6097, -74.0817] // Bogotá por defecto
    }

    const avgLat = socializersWithLocation.reduce((sum, s) => sum + s.latestLocation!.latitude, 0) / socializersWithLocation.length
    const avgLong = socializersWithLocation.reduce((sum, s) => sum + s.latestLocation!.longitude, 0) / socializersWithLocation.length
    
    return [avgLat, avgLong]
  }

  // Generar un key único basado en todas las posiciones para forzar actualización del mapa
  const getMapKey = (): string => {
    const positionsHash = socializersWithLocation
      .map(s => `${s._id}-${s.latestLocation?.latitude}-${s.latestLocation?.longitude}-${s.latestLocation?.timestamp}`)
      .join('|')
    return `map-${positionsHash}`
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="dashboard-layout__content">
        <div className="dashboard-layout__header">
          <button 
            className="dashboard-layout__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="dashboard-layout__title">Reportes - Ubicaciones en Tiempo Real</h1>
        </div>

        <div className="dashboard-layout__body">
          {error && (
            <div className="survey-form__error" style={{ marginBottom: '1rem' }}>
              <p>{error}</p>
            </div>
          )}

          {isLoading && socializers.length === 0 ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando ubicaciones de socializadores...</p>
            </div>
          ) : socializers.length === 0 && !isLoading ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h2 className="empty-state__title">
                No hay ubicaciones disponibles
              </h2>
              <p className="empty-state__description">
                Los socializadores aún no han compartido su ubicación o no hay socializadores activos en este momento.
              </p>
              <button 
                className="btn btn--primary"
                onClick={loadSocializers}
                style={{ marginTop: '1.5rem' }}
              >
                🔄 Intentar nuevamente
              </button>
            </div>
          ) : (
            <div className="reports-realtime">
              <div className="reports-realtime__header">
                <div className="reports-realtime__stats">
                  <div className="stat-card">
                    <div className="stat-card__value">{socializersWithLocation.length}</div>
                    <div className="stat-card__label">Con ubicación</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__value">{socializersWithoutLocation.length}</div>
                    <div className="stat-card__label">Sin ubicación</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__value">{socializers.length}</div>
                    <div className="stat-card__label">Total socializadores</div>
                  </div>
                </div>
                <button 
                  className="btn btn--secondary"
                  onClick={loadSocializers}
                  disabled={isLoading}
                >
                  {isLoading ? 'Actualizando...' : '🔄 Actualizar'}
                </button>
              </div>

              <div className="reports-realtime__content">
                {socializersWithLocation.length > 0 ? (
                <div className="reports-realtime__map-container">
                  <h3 style={{ marginBottom: '1rem', color: '#4a7c6f' }}>
                    Mapa de Ubicaciones ({socializersWithLocation.length} {socializersWithLocation.length === 1 ? 'socializador' : 'socializadores'})
                  </h3>
                  <MapContainer
                    key={getMapKey()}
                    center={getMapCenter()}
                    zoom={socializersWithLocation.length === 1 ? 15 : 11}
                    style={{ height: '500px', width: '100%', borderRadius: '8px' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution={EXTERNAL_URLS.LEAFLET_ATTRIBUTION}
                      url={EXTERNAL_URLS.LEAFLET_TILE_URL}
                    />
                    {socializersWithLocation.map((socializer) => (
                          <Marker
                            key={`${socializer._id}-${socializer.latestLocation!.timestamp}`}
                            position={[socializer.latestLocation!.latitude, socializer.latestLocation!.longitude]}
                            icon={defaultIcon}
                          >
                          <Popup>
                            <div className="map-popup">
                              <h4 className="map-popup__title">{socializer.fullName}</h4>
                              <p className="map-popup__info">
                                <strong>ID:</strong> {socializer.idNumber}
                              </p>
                              <p className="map-popup__info">
                                <strong>Email:</strong> {socializer.user.email}
                              </p>
                              {socializer.coordinator && (
                                <p className="map-popup__info">
                                  <strong>Coordinador:</strong> {socializer.coordinator.fullName}
                                </p>
                              )}
                              <p className="map-popup__info">
                                <strong>Coordenadas:</strong><br />
                                Lat: {socializer.latestLocation!.latitude?.toFixed(6) || 'N/A'}<br />
                                Long: {socializer.latestLocation!.longitude?.toFixed(6) || 'N/A'}
                              </p>
                              {socializer.latestLocation!.accuracy != null && (
                                <p className="map-popup__info">
                                  <strong>Precisión:</strong> ±{socializer.latestLocation!.accuracy.toFixed(1)}m
                                </p>
                              )}
                              {socializer.latestLocation!.speed != null && (
                                <p className="map-popup__info">
                                  <strong>Velocidad:</strong> {socializer.latestLocation!.speed.toFixed(1)} m/s
                                </p>
                              )}
                              <p className="map-popup__info">
                                <strong>Última actualización:</strong><br />
                                {formatDate(socializer.latestLocation!.timestamp)}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state__icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h2 className="empty-state__title">
                    No se encontraron ubicaciones
                  </h2>
                  <p className="empty-state__description">
                    Ningún socializador tiene ubicación registrada en este momento.
                  </p>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
