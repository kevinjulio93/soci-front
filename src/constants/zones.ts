/**
 * Zonas de municipios para el formulario de encuestas
 * Cada zona agrupa municipios por área geográfica
 */

export interface ZoneMunicipality {
  name: string
  department: string
}

export interface Zone {
  id: string
  label: string
  zonaNumber: number
  municipalities?: ZoneMunicipality[]
}

export const ZONES: Zone[] = [
  {
    id: 'zona1',
    label: 'Zona 1',
    zonaNumber: 1,
  },
  {
    id: 'zona2',
    label: 'Zona 2',
    zonaNumber: 2,
  },
  {
    id: 'zona3',
    label: 'Zona 3',
    zonaNumber: 3,
  },
  {
    id: 'zona4',
    label: 'Zona 4',
    zonaNumber: 4,
  },
  {
    id: 'zona5',
    label: 'Zona 5',
    zonaNumber: 5,
  },
]

/** Obtener todas las zonas como opciones para un select */
export const ZONE_OPTIONS = ZONES.map((zone) => ({
  value: zone.id,
  label: zone.label,
}))

/** Obtener municipios de una zona por su ID */
export const getMunicipalitiesByZone = (zoneId: string): ZoneMunicipality[] => {
  const zone = ZONES.find((z) => z.id === zoneId)
  return zone?.municipalities || []
}

/** Obtener departamentos únicos de una zona */
export const getDepartmentsByZone = (zoneId: string): string[] => {
  const municipalities = getMunicipalitiesByZone(zoneId)
  return [...new Set(municipalities.map((m) => m.department))]
}

/** Obtener municipios de una zona filtrados por departamento */
export const getMunicipalitiesByZoneAndDepartment = (
  zoneId: string,
  department: string
): string[] => {
  const municipalities = getMunicipalitiesByZone(zoneId)
  return municipalities
    .filter((m) => m.department === department)
    .map((m) => m.name)
}
