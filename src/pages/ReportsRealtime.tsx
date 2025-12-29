/**
 * ReportsRealtime - Ubicación en tiempo real de socializadores
 * Muestra un mapa con las ubicaciones actuales de todos los socializadores
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Sidebar, StatCard, LoadingState, EmptyState, MapPopup, MenuIcon, RefreshIcon, BackIcon } from '../components'
import { apiService } from '../services/api.service'
import { notificationService } from '../services/notification.service'
import { useAuth } from '../contexts/AuthContext'
import { EXTERNAL_URLS, MAP_CONFIG, MESSAGES, LOCALE_CONFIG, SYNC_CONFIG, ROUTES } from '../constants'
import 'leaflet/dist/leaflet.css'
import '../styles/Dashboard.scss'

interface SocializerLocation {
  _id: string
  fullName: string
  idNumber: string
  phone?: string
  status: string
  user: {
    _id: string
    email: string
    role?: string
    status?: string
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
    speed?: number | null
    heading?: number | null
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
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [socializers, setSocializers] = useState<SocializerLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBackToReports = () => {
    navigate(ROUTES.ADMIN_REPORTS)
  }

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
      
      console.log('Total socializadores recibidos del backend:', socializersList.length)
      console.log('Datos completos:', socializersList)
      
      // Si el usuario es coordinador, filtrar solo sus socializadores asignados
      const userRole = user?.role?.role?.toLowerCase()
      if (userRole === 'coordinador' || userRole === 'coordinator') {
        const beforeFilter = socializersList.length
        socializersList = socializersList.filter((s: SocializerLocation) => 
          s.coordinator && s.coordinator.user === user?.id
        )
        console.log(`Filtro de coordinador: ${beforeFilter} -> ${socializersList.length}`)
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
  
  console.log('Socializadores con ubicación válida:', socializersWithLocation.length)
  console.log('Detalles:', socializersWithLocation.map(s => ({
    nombre: s.fullName,
    lat: s.latestLocation?.latitude,
    long: s.latestLocation?.longitude
  })))
  
  // Aplicar pequeño offset a marcadores que comparten la misma ubicación
  const getAdjustedPosition = (socializer: SocializerLocation, index: number): [number, number] => {
    const lat = socializer.latestLocation!.latitude
    const long = socializer.latestLocation!.longitude
    
    // Verificar si hay otros socializadores en la misma ubicación (hasta 4 decimales)
    const sameLocationCount = socializersWithLocation.filter((s, i) => {
      if (i >= index) return false // Solo contar los anteriores
      const sLat = s.latestLocation!.latitude
      const sLong = s.latestLocation!.longitude
      return Math.abs(sLat - lat) < 0.0001 && Math.abs(sLong - long) < 0.0001
    }).length
    
    if (sameLocationCount > 0) {
      // Aplicar offset pequeño en círculo alrededor del punto original
      const angle = (sameLocationCount * 60) * (Math.PI / 180) // 60 grados entre cada marcador
      const offsetDistance = 0.0002 // ~20 metros
      const latOffset = Math.sin(angle) * offsetDistance
      const longOffset = Math.cos(angle) * offsetDistance
      
      return [lat + latOffset, long + longOffset]
    }
    
    return [lat, long]
  }
  
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
            <MenuIcon size={24} />
          </button>
          <button className="btn-back" onClick={handleBackToReports}>
            <BackIcon size={20} />
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
            <LoadingState message={MESSAGES.LOADING_LOCATIONS} />
          ) : socializers.length === 0 && !isLoading ? (
            <EmptyState 
              title={MESSAGES.EMPTY_LOCATIONS_TITLE}
              description={MESSAGES.EMPTY_LOCATIONS_DESC}
              action={{
                label: MESSAGES.BTN_TRY_AGAIN,
                onClick: loadSocializers
              }}
            />
          ) : (
            <div className="reports-realtime">
              <div className="reports-realtime__header">
                <div className="reports-realtime__stats">
                  <StatCard 
                    value={socializersWithLocation.length.toString()}
                    label="Con ubicación"
                    variant="success"
                  />
                  <StatCard 
                    value={socializersWithoutLocation.length.toString()}
                    label="Sin ubicación"
                    variant="warning"
                  />
                  <StatCard 
                    value={socializers.length.toString()}
                    label="Total socializadores"
                    variant="primary"
                  />
                </div>
                <button 
                  className="btn btn--refresh"
                  onClick={loadSocializers}
                  disabled={isLoading}
                >
                  <RefreshIcon size={16} />
                  {isLoading ? 'Actualizando...' : 'Actualizar'}
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
                    {socializersWithLocation.map((socializer, index) => (
                          <Marker
                            key={`${socializer._id}-${socializer.latestLocation!.timestamp}`}
                            position={getAdjustedPosition(socializer, index)}
                            icon={defaultIcon}
                          >
                          <Popup>
                            <MapPopup 
                              title={socializer.fullName}
                              fields={[
                                { label: 'ID', value: socializer.idNumber },
                                { label: 'Email', value: socializer.user.email },
                                ...(socializer.coordinator ? [{ label: 'Supervisor', value: socializer.coordinator.fullName }] : []),
                                { label: 'Coordenadas', value: `Lat: ${socializer.latestLocation!.latitude?.toFixed(6) || 'N/A'}\nLong: ${socializer.latestLocation!.longitude?.toFixed(6) || 'N/A'}` },
                                ...(socializer.latestLocation!.accuracy != null ? [{ label: 'Precisión', value: `±${socializer.latestLocation!.accuracy.toFixed(1)}m` }] : []),
                                ...(socializer.latestLocation!.speed != null ? [{ label: 'Velocidad', value: `${socializer.latestLocation!.speed.toFixed(1)} m/s` }] : []),
                                { label: 'Última actualización', value: formatDate(socializer.latestLocation!.timestamp) }
                              ]}
                            />
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                </div>
              ) : (
                <EmptyState 
                  title={MESSAGES.EMPTY_NO_LOCATION_FOUND}
                  description={MESSAGES.EMPTY_NO_LOCATION_DESC}
                />
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
