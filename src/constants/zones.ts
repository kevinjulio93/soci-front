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
  municipalities: ZoneMunicipality[]
}

export const ZONES: Zone[] = [
  {
    id: 'zona1',
    label: 'Zona 1',
    municipalities: [
      { name: 'Bogotá D.C.', department: 'Bogotá' },
      { name: 'Soacha', department: 'Cundinamarca' },
      { name: 'Fusagasugá', department: 'Cundinamarca' },
      { name: 'Girardot', department: 'Cundinamarca' },
    ],
  },
  {
    id: 'zona2',
    label: 'Zona 2',
    municipalities: [
      { name: 'Chía', department: 'Cundinamarca' },
      { name: 'Zipaquirá', department: 'Cundinamarca' },
      { name: 'Cajicá', department: 'Cundinamarca' },
      { name: 'Tenjo', department: 'Cundinamarca' },
      { name: 'Sopó', department: 'Cundinamarca' },
      { name: 'Nemocón', department: 'Cundinamarca' },
      { name: 'Cota', department: 'Cundinamarca' },
      { name: 'Mosquera', department: 'Cundinamarca' },
      { name: 'Facatativá', department: 'Cundinamarca' },
      { name: 'Madrid', department: 'Cundinamarca' },
      { name: 'Funza', department: 'Cundinamarca' },
      { name: 'Tunja', department: 'Boyacá' },
      { name: 'Sogamoso', department: 'Boyacá' },
      { name: 'Duitama', department: 'Boyacá' },
    ],
  },
  {
    id: 'zona3',
    label: 'Zona 3',
    municipalities: [
      { name: 'Medellín', department: 'Antioquia' },
      { name: 'Bello', department: 'Antioquia' },
      { name: 'Itagüí', department: 'Antioquia' },
      { name: 'Envigado', department: 'Antioquia' },
      { name: 'Turbo', department: 'Antioquia' },
      { name: 'Sabaneta', department: 'Antioquia' },
      { name: 'La Ceja', department: 'Antioquia' },
      { name: 'Cali', department: 'Valle del Cauca' },
      { name: 'Palmira', department: 'Valle del Cauca' },
      { name: 'Buenaventura', department: 'Valle del Cauca' },
      { name: 'Jamundí', department: 'Valle del Cauca' },
      { name: 'Yumbo', department: 'Valle del Cauca' },
      { name: 'Candelaria', department: 'Valle del Cauca' },
    ],
  },
  {
    id: 'zona4',
    label: 'Zona 4',
    municipalities: [
      { name: 'Bucaramanga', department: 'Santander' },
      { name: 'Floridablanca', department: 'Santander' },
      { name: 'Barrancabermeja', department: 'Santander' },
      { name: 'Girón', department: 'Santander' },
      { name: 'Piedecuesta', department: 'Santander' },
      { name: 'Cúcuta', department: 'Norte de Santander' },
      { name: 'Villa del Rosario', department: 'Norte de Santander' },
      { name: 'Los Patios', department: 'Norte de Santander' },
    ],
  },
  {
    id: 'zona5',
    label: 'Zona 5',
    municipalities: [
      { name: 'Barranquilla', department: 'Atlántico' },
      { name: 'Soledad', department: 'Atlántico' },
    ],
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
