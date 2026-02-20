# Componente MetricsCard - Guía de Integración

## Descripción
`MetricsCard` es un componente reutilizable que muestra métricas de encuestas con validación automática de permisos jerárquicos.

Se utiliza en:
- Admin Dashboard
- Reports page (general)
- Socializer Dashboard (vista diaria)

## Características

### 1. Validación de Permisos Jerárquica
El componente valida automáticamente qué métricas puede ver según el rol:

| Rol | Puede ver | No puede ver |
|-----|-----------|-------------|
| **Admin** | Total, Exitosas, No Exitosas*, Defensores | Nada (acceso completo) |
| **Coordinador de Zona** | Total, Exitosas, No Exitosas*, Defensores | Nada (acceso completo) |
| **Coordinador de Campo** | Total, Exitosas, No Exitosas*, Defensores | Nada (acceso completo) |
| **Supervisor** | Total, Exitosas, Defensores | No Exitosas, Motivos de Rechazo |
| **Socializador** | Solo sus métricas por día | Métricas de otros |

*Las métricas "No Exitosas" y "Motivos de Rechazo" no se muestran para Supervisores.

### 2. Filtrado de Datos
El componente filtra automáticamente según la jerarquía del usuario:
- **Admin**: Ve datos de todos los socializadores, coordinadores, supervisores
- **Coordinador de Zona**: Ve datos de sus coordinadores de campo y supervisores
- **Coordinador de Campo**: Ve datos de sus supervisores
- **Supervisor**: Ve datos que le están asignados a él
- **Socializador**: Solo ve sus propias métricas

### 3. Vista Diaria
Para Socializadores, muestra:
- Desglose por día
- Total de encuestas por día
- Exitosas por día
- No exitosas por día (si aplica)
- Defensores por día

## Uso Básico

### En Admin Dashboard
```tsx
import { MetricsCard } from '../components'

export function AdminDashboard() {
  return (
    <div>
      <h1>Dashboard Admin</h1>
      <MetricsCard 
        viewType="admin" 
        showDailyView={false}
      />
    </div>
  )
}
```

### En Reports Page
```tsx
import { MetricsCard } from '../components'

export function Reports() {
  return (
    <div>
      <h1>Reportes</h1>
      <MetricsCard 
        viewType="coordinador_zona" 
        showDailyView={false}
        onMetricsLoaded={(data) => {
          console.log('Métricas cargadas:', data)
        }}
      />
    </div>
  )
}
```

### En Socializer Dashboard (Vista Diaria)
```tsx
import { MetricsCard } from '../components'

export function SocializerDashboard() {
  return (
    <div>
      <h1>Mi Dashboard</h1>
      <MetricsCard 
        viewType="socializer" 
        showDailyView={true}
      />
    </div>
  )
}
```

## Props

```typescript
interface MetricsCardProps {
  /** Tipo de vista: admin, coordinador_zona, coordinador_campo, supervisor, socializer */
  viewType: 'admin' | 'coordinador_zona' | 'coordinador_campo' | 'supervisor' | 'socializer'
  
  /** Mostrar vista por día (true) o agregada (false) */
  showDailyView?: boolean
  
  /** Callback cuando se aplican filtros */
  onMetricsLoaded?: (data: MetricsData) => void
}
```

## Estructura de Datos Retornada

```typescript
interface MetricsData {
  total: number                    // Total de encuestas
  successful: number               // Encuestas exitosas
  unsuccessful: number             // Encuestas no exitosas
  defensores: number               // Defensores de la Patria
  dailyStats?: DailyStat[]        // Desglose por día (si aplica)
  rejectionStats?: RejectionStat[] // Motivos de rechazo
  loadedAt: string                // Timestamp de cuando se cargaron
}

interface DailyStat {
  date: string               // Fecha en formato ISO
  total: number
  successful: number
  unsuccessful: number
  defensores: number
}

interface RejectionStat {
  label: string   // Nombre legible del motivo
  count: number   // Cantidad de rechazos
  value: string   // Valor del motivo en base de datos
}
```

## Funciones Utilitarias Exportadas

### validateMetricsPermissions(userRole: string)
Valida qué métricas puede ver el usuario según su rol.

```typescript
import { validateMetricsPermissions } from '../components'

const permissions = validateMetricsPermissions('admin')
// {
//   canViewUnsuccessful: true,
//   canViewDailyBreakdown: true
// }
```

### getMetricsApiParams(userRole, userId, startDate, endDate)
Genera los parámetros necesarios para la llamada a la API.

```typescript
import { getMetricsApiParams } from '../components'

const params = getMetricsApiParams(
  'coordinator',
  'user123',
  '2024-01-01',
  '2024-01-31'
)
// Retorna: { url, params }
```

## Endpoints Backend Esperados

### 1. Métricas por Jerarquía
**Endpoint**: `GET /dashboard/metrics`

**Query Parameters**:
- `role`: Rol del usuario (admin, coordinador_zona, etc.)
- `userId`: ID del usuario autenticado
- `startDate`: Fecha inicial (YYYY-MM-DD)
- `endDate`: Fecha final (YYYY-MM-DD)

**Response**:
```json
{
  "total": 100,
  "successful": 85,
  "unsuccessful": 15,
  "defensores": 5,
  "dailyStats": [
    {
      "date": "2024-02-19",
      "total": 10,
      "successful": 8,
      "unsuccessful": 2,
      "defensores": 1
    }
  ],
  "rejectionStats": [
    {
      "label": "No está en casa",
      "count": 7,
      "value": "not_home"
    }
  ]
}
```

### 2. Métricas Diarias del Socializador
**Endpoint**: `GET /dashboard/metrics/daily`

**Query Parameters**:
- `startDate`: Fecha inicial (YYYY-MM-DD)
- `endDate`: Fecha final (YYYY-MM-DD)

**Response**:
```json
{
  "totalSurveys": 50,
  "totalSuccessful": 40,
  "totalUnsuccessful": 10,
  "totalDefensores": 2,
  "dailyStats": [
    {
      "date": "2024-02-19",
      "total": 10,
      "successful": 8,
      "unsuccessful": 2,
      "defensores": 1
    }
  ],
  "rejectionStats": [...]
}
```

## Lógica de Filtrado Backend

El backend debe implementar la siguiente lógica:

```
SI role = 'admin':
  Retornar métricas de TODOS los usuarios

SI role = 'coordinador_zona':
  Retornar métricas de:
    - Los coordinadores de campo asignados a esta zona
    - Los supervisores asignados a esta zona
    - Los socializadores asignados a este coordinador de zona

SI role = 'coordinador_campo':
  Retornar métricas de:
    - Los supervisores asignados a este coordinador
    - Los socializadores asignados a este coordinador

SI role = 'supervisor':
  Retornar métricas de:
    - Los socializadores asignados a este supervisor

SI role = 'socializer':
  Retornar SOLO las métricas del usuario autenticado
```

## Estilos

El componente utiliza clases BEM. Para personalización, editar `src/styles/MetricsCard.scss`:

- `.metrics-card` - Contenedor principal
- `.filter-card` - Tarjeta de filtros
- `.stat-card` - Tarjetas de estadísticas
- `.rejection-breakdown` - Desglose de motivos
- `.daily-metrics` - Métricas diarias
- `.daily-metric-card` - Tarjeta de métrica diaria

## Consideraciones importantes

1. **El componente determina automáticamente el rol del usuario** desde `useAuth()`, no es necesario pasarlo explícitamente.

2. **El filtrado se hace en el backend**, no en el frontend. El frontend solo valida qué mostrar.

3. **Para Socializadores**, el componente automáticamente:
   - Oculta el desglose de rechazo (porque no pueden ver otros usuarios)
   - Muestra la vista diaria (porque es su métrica principal)

4. **Los estilos son responsive** y se adaptan a móvil automáticamente.

## Ejemplo Completo: Admin Dashboard

```tsx
import { useState } from 'react'
import { MetricsCard, MetricsData } from '../components'
import { Sidebar } from '../components'

export default function AdminDashboard() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMetricsLoaded = (data: MetricsData) => {
    setMetricsData(data)
    // Aquí podrías hacer algo con los datos cargados
    console.log('Nuevas métricas:', data)
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="dashboard-layout__content">
        <div className="dashboard-layout__header">
          <h1>Dashboard Administrador</h1>
        </div>

        <div className="dashboard-layout__body">
          <MetricsCard 
            viewType="admin" 
            showDailyView={false}
            onMetricsLoaded={handleMetricsLoaded}
          />
          
          {metricsData && (
            <div>
              {/* Contenido adicional basado en metricsData */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```
