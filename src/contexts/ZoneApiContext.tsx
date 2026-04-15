/**
 * ZoneApiContext - Contexto para cambiar de API por zona
 * Permite a superadmins seleccionar zonas y consultar cada zona con su propia API.
 * Cada zona tiene un apiUrl propio (ej. zona1-api.contactodirectocol.com).
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  ApiService,
  apiService,
  type ZoneItem,
  type GetZonesResponse,
} from '../services/api.service'

// ─── Tipos ──────────────────────────────────────────────

/** Resultado de consulta para una zona individual */
export interface ZoneQueryResult<T> {
  zoneId: string
  zoneName: string
  zoneNumber: number
  data: T | null
  error?: string
}

interface ZoneApiContextType {
  /** Lista de zonas disponibles (cargadas del endpoint /zones) */
  zones: ZoneItem[]
  /** IDs de zonas seleccionadas */
  selectedZoneIds: string[]
  /** Actualizar zonas seleccionadas */
  setSelectedZoneIds: (ids: string[]) => void
  /** Indica si las zonas están cargando */
  isLoadingZones: boolean
  /** true si el usuario es superadmin */
  isSuperAdmin: boolean
  /** Obtiene una instancia de ApiService configurada para una zona */
  getApiServiceForZone: (zoneId: string) => ApiService | null
  /**
   * Ejecuta una consulta en todas las zonas seleccionadas en paralelo.
   * Cada zona usa su propia instancia ApiService apuntando a su apiUrl.
   * Las consultas fallidas se incluyen en el resultado con error (no interrumpen las demás).
   */
  querySelectedZones: <T>(
    queryFn: (api: ApiService, zone: ZoneItem) => Promise<T>
  ) => Promise<ZoneQueryResult<T>[]>
}

const ZoneApiContext = createContext<ZoneApiContextType | null>(null)

// ─── Helpers ────────────────────────────────────────────

/** Construye la URL base completa a partir del apiUrl de una zona */
function buildZoneApiUrl(apiUrl: string): string {
  if (!apiUrl) return ''
  const base = apiUrl.startsWith('http') ? apiUrl : `https://${apiUrl}`
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`
}

// ─── Provider ───────────────────────────────────────────

export function ZoneApiProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [zones, setZones] = useState<ZoneItem[]>([])
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([])
  const [isLoadingZones, setIsLoadingZones] = useState(false)

  const userRole = user?.role?.role?.toLowerCase() || ''
  const isSuperAdmin = userRole === 'superadmin'

  // Cargar zonas al montar si es superadmin
  useEffect(() => {
    if (!isSuperAdmin) {
      setZones([])
      setSelectedZoneIds([])
      return
    }

    let cancelled = false
    const loadZones = async () => {
      setIsLoadingZones(true)
      try {
        const response: GetZonesResponse = await apiService.getZones()
        if (!cancelled) {
          setZones(response.zones || [])
        }
      } catch {
        if (!cancelled) setZones([])
      } finally {
        if (!cancelled) setIsLoadingZones(false)
      }
    }

    loadZones()
    return () => {
      cancelled = true
    }
  }, [isSuperAdmin])

  // Cache de instancias ApiService por zona (se recalcula cuando cambian las zonas)
  const zoneApiServices = useMemo(() => {
    const map = new Map<string, ApiService>()
    for (const zone of zones) {
      if (zone.apiUrl) {
        const url = buildZoneApiUrl(zone.apiUrl)
        if (url) {
          map.set(zone._id, ApiService.createWithBaseUrl(url))
        }
      }
    }
    return map
  }, [zones])

  const getApiServiceForZone = useCallback(
    (zoneId: string): ApiService | null => {
      return zoneApiServices.get(zoneId) ?? null
    },
    [zoneApiServices]
  )

  const querySelectedZones = useCallback(
    async <T,>(
      queryFn: (api: ApiService, zone: ZoneItem) => Promise<T>
    ): Promise<ZoneQueryResult<T>[]> => {
      const zonesToQuery = zones.filter((z) => selectedZoneIds.includes(z._id))

      if (zonesToQuery.length === 0) return []

      const results = await Promise.allSettled(
        zonesToQuery.map(async (zone) => {
          const api = getApiServiceForZone(zone._id)
          if (!api) {
            throw new Error(`No se pudo crear la conexión API para ${zone.name}`)
          }
          const data = await queryFn(api, zone)
          return {
            zoneId: zone._id,
            zoneName: zone.name,
            zoneNumber: zone.zoneNumber,
            data,
          } as ZoneQueryResult<T>
        })
      )

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        }
        const zone = zonesToQuery[index]
        return {
          zoneId: zone._id,
          zoneName: zone.name,
          zoneNumber: zone.zoneNumber,
          data: null,
          error: result.reason?.message || 'Error desconocido',
        }
      })
    },
    [zones, selectedZoneIds, getApiServiceForZone]
  )

  const value = useMemo<ZoneApiContextType>(
    () => ({
      zones,
      selectedZoneIds,
      setSelectedZoneIds,
      isLoadingZones,
      isSuperAdmin,
      getApiServiceForZone,
      querySelectedZones,
    }),
    [zones, selectedZoneIds, isLoadingZones, isSuperAdmin, getApiServiceForZone, querySelectedZones]
  )

  return (
    <ZoneApiContext.Provider value={value}>{children}</ZoneApiContext.Provider>
  )
}

// ─── Hook ───────────────────────────────────────────────

export function useZoneApi(): ZoneApiContextType {
  const context = useContext(ZoneApiContext)
  if (!context) {
    throw new Error('useZoneApi debe usarse dentro de un ZoneApiProvider')
  }
  return context
}
