# Funcionalidad Offline - Modo Sin Conexión

## 📱 Descripción

La aplicación ahora soporta **modo offline completo**, permitiendo recolectar encuestas sin conexión a internet y sincronizarlas automáticamente cuando se recupere la conexión.

## ✨ Características

### 1. **Detección Automática de Conexión**
- Indicador visual cuando no hay conexión (🔴 Sin conexión)
- La app detecta automáticamente cuando pierdes/recuperas internet
- Todo funciona sin interrupciones, offline o online

### 2. **Almacenamiento Local (IndexedDB)**
- Las encuestas se guardan localmente cuando no hay conexión
- Se almacenan tanto los datos del formulario como el audio grabado
- Capacidad de almacenamiento: varios GB (limitado por el navegador)

### 3. **Sincronización Automática**
- Cuando recuperas la conexión, las encuestas se sincronizan automáticamente
- Sincronización inteligente: primero datos, luego audio
- Reintento automático en caso de error

### 4. **Sincronización Manual**
- Botón "Sincronizar" visible cuando hay encuestas pendientes
- Muestra el número de encuestas esperando sincronización
- Indicador visual durante la sincronización (🔄 Sincronizando...)

## 🚀 Uso

### Guardar Encuesta Offline

1. **Sin conexión**, llena el formulario normalmente
2. Haz clic en "Guardar y Continuar"
3. Verás mensajes en consola:
   ```
   📴 Sin conexión - Guardando encuesta localmente...
   ✅ Encuesta guardada localmente con ID: pending_xxxxx
   🔄 Se sincronizará automáticamente cuando recuperes la conexión
   ```

### Sincronización Automática

Cuando recuperes la conexión:
1. La app detecta automáticamente que estás online
2. Después de 2 segundos, inicia la sincronización
3. Las encuestas se envían al backend una por una
4. El dashboard se actualiza con los nuevos datos

### Sincronización Manual

Si quieres forzar la sincronización:
1. Ve al Dashboard
2. Verás un botón "Sincronizar (X)" donde X es el número de pendientes
3. Haz clic para sincronizar inmediatamente
4. El botón mostrará "Sincronizando..." durante el proceso

## 🏗️ Arquitectura

### Servicios Creados

1. **indexedDB.service.ts**
   - Maneja el almacenamiento local con IndexedDB
   - Guarda encuestas y audio separadamente
   - Marca encuestas como sincronizadas

2. **sync.service.ts**
   - Gestiona la sincronización con el backend
   - Maneja errores y reintentos
   - Auto-sincronización configurable

### Hooks Personalizados

1. **useOnlineStatus**
   - Detecta cambios en la conexión
   - Actualiza el estado en tiempo real

2. **useSyncStatus**
   - Proporciona estado de sincronización
   - Maneja sincronización manual
   - Cuenta encuestas pendientes

## 💾 Estructura de Datos

### Encuesta Pendiente
```typescript
{
  id: "pending_1234567890_abc123",
  data: {
    fullName: "Juan Pérez",
    identification: "123456789",
    // ... más campos
  },
  timestamp: 1234567890000,
  synced: false,
  error: undefined // o mensaje de error si falló
}
```

### Audio Blob
```typescript
{
  id: "pending_1234567890_abc123",
  blob: Blob // Audio WebM
}
```

## 🔄 Flujo de Sincronización

1. **Guardar Offline**
   ```
   Usuario → Formulario → IndexedDB
                           ↓
                    (almacenado localmente)
   ```

2. **Sincronizar Online**
   ```
   IndexedDB → Sync Service → API Backend
       ↓           ↓              ↓
   Marcar     Subir Audio    Crear Respondent
   Synced
   ```

## 📊 Indicadores Visuales

| Estado | Indicador | Descripción |
|--------|-----------|-------------|
| Offline | 🔴 Sin conexión | No hay internet |
| Pendientes | Sincronizar (3) | 3 encuestas esperando |
| Sincronizando | 🔄 Sincronizando... | En proceso |
| Sin pendientes | - | Todo sincronizado |

## 🛠️ Configuración

### Cambiar Intervalo de Auto-Sincronización

En `src/pages/SociologistDashboard.tsx`:
```typescript
// Por defecto: 5 minutos
syncService.startAutoSync(5)

// Cambiar a 10 minutos:
syncService.startAutoSync(10)
```

### Limpiar Encuestas Sincronizadas

```typescript
import { indexedDBService } from './services/indexedDB.service'

// Limpiar todas las ya sincronizadas
await indexedDBService.clearSyncedRespondents()
```

## ⚠️ Consideraciones

1. **Límite de Almacenamiento**: Varía por navegador (típicamente 50MB-100MB)
2. **Audio Grande**: Archivos de audio pueden ocupar mucho espacio
3. **Caché del Navegador**: Puede ser limpiado por el usuario
4. **HTTPS Requerido**: Para Service Workers (producción)

## 🐛 Debug

Ver mensajes de sincronización en consola:
```javascript
// Consola del navegador
localStorage.debug = 'sync:*'
```

Ver encuestas pendientes:
```javascript
import { indexedDBService } from './services/indexedDB.service'

// Ver todas las pendientes
const pending = await indexedDBService.getPendingRespondents()
console.log('Pendientes:', pending)
```

## 📱 Compatibilidad

- ✅ Chrome 60+
- ✅ Firefox 58+
- ✅ Safari 15+
- ✅ Edge 79+
- ⚠️ IndexedDB requerido
