/**
 * LocationModal - Modal para visualizar ubicación en mapa
 * Muestra la ubicación en tiempo real de un socializador
 */

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import { apiService } from '../services/api.service'
import { EXTERNAL_URLS, MAP_CONFIG, MESSAGES, LOCALE_CONFIG } from '../constants'
import { RefreshIcon, ExternalLinkIcon } from './Icons'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col gap-0">
        <DialogHeader className="flex-row items-center justify-between border-b pb-3 pr-8">
          <DialogTitle>Ubicación de {socializerName}</DialogTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Actualizar ubicación"
          >
            <RefreshIcon size={18} />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-sm">Cargando ubicación...</p>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {!isLoading && !error && location && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{MESSAGES.LABEL_LATITUDE}</span>
                  <span className="font-medium">{location.lat.toFixed(6)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{MESSAGES.LABEL_LONGITUDE}</span>
                  <span className="font-medium">{location.long.toFixed(6)}</span>
                </div>
                {location.accuracy && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">{MESSAGES.LABEL_ACCURACY}</span>
                    <span className="font-medium">{location.accuracy}m</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{MESSAGES.LABEL_LAST_UPDATE}</span>
                  <span className="font-medium">{formatDate(location.timestamp)}</span>
                </div>
              </div>

              <div className="rounded-lg overflow-hidden">
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

              <div className="flex justify-end">
                <a
                  href={EXTERNAL_URLS.GOOGLE_MAPS_QUERY(location.lat, location.long)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <ExternalLinkIcon size={14} />
                  {MESSAGES.TOOLTIP_OPEN_MAPS}
                </a>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
