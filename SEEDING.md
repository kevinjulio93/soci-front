# 🌱 Script de Seeding - Jerarquía de Usuarios

Este script crea una estructura jerárquica completa de usuarios y encuestas de prueba en la API.

## 📊 Estructura Creada

```
Admin (1)
├── Coordinador de Zona 1 (1/2)
│   ├── Coordinador de Campo 1 (1/2)
│   │   ├── Supervisor 1 (1/2)
│   │   │   ├── Socializador 1 (1/4)
│   │   │   │   ├── Encuesta 1
│   │   │   │   └── Encuesta 2
│   │   │   └── Socializador 2 (2/4)
│   │   │       ├── Encuesta 3
│   │   │       └── Encuesta 4
├── Coordinador de Zona 2 (2/2)
│   ├── Coordinador de Campo 2 (2/2)
│   │   ├── Supervisor 2 (2/2)
│   │   │   ├── Socializador 3 (3/4)
│   │   │   │   ├── Encuesta 5
│   │   │   │   └── Encuesta 6
│   │   │   └── Socializador 4 (4/4)
│   │   │       ├── Encuesta 7
│   │   │       └── Encuesta 8
```

**Total Creado:**
- 1 Admin
- 2 Coordinadores de Zona
- 2 Coordinadores de Campo
- 2 Supervisores
- 4 Socializadores
- 8 Encuestas

## 🚀 Cómo Usar

### 1. Configurar la URL de la API

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Luego edita `.env.local` con la URL correcta de tu API:

```env
# Para desarrollo local
API_BASE_URL=http://localhost:3000/api/v1

# O para ngrok (asegúrate de que sea la URL correcta)
API_BASE_URL=https://xxxx-xxxx-xxxx.ngrok-free.app/api/v1
```

### 2. Ejecutar el Script

```bash
# Opción 1: Usar el script bash
chmod +x scripts/run-seed.sh
./scripts/run-seed.sh

# Opción 2: Ejecutar directamente con ts-node
npx ts-node scripts/seed-hierarchy.ts
```

## 🔐 Credenciales de Prueba

Después de ejecutar el script, podrás usar estas credenciales:

### Admin
```
Email: admin.test@soci.app
Password: AdminTest123!
```

### Ejemplo Socializador (Zona 1, Socializador 1)
```
Email: socializer.zone1_1@soci.app
Password: Socializer1_1Test123!
```

### Patrón de Nombres

- **Coordinadores de Zona:**
  - `zone.coordinator.1@soci.app` / `ZoneCoord1Test123!`
  - `zone.coordinator.2@soci.app` / `ZoneCoord2Test123!`

- **Coordinadores de Campo:**
  - `field.coordinator.zone1@soci.app` / `FieldCoord1Test123!`
  - `field.coordinator.zone2@soci.app` / `FieldCoord2Test123!`

- **Supervisores:**
  - `supervisor.zone1@soci.app` / `Supervisor1Test123!`
  - `supervisor.zone2@soci.app` / `Supervisor2Test123!`

- **Socializadores:**
  - `socializer.zone{Z}_{S}@soci.app` / `Socializer{Z}_{S}Test123!`
  - Donde Z = número de zona (1-2) y S = número de socializador (1-2)

## ⚠️ Requisitos Previos

1. **API ejecutándose:** Asegúrate de que el servidor backend esté corriendo
2. **Conexión a la red:** Si usas ngrok, verifica que la URL sea válida
3. **Roles en base de datos:** La API debe tener los siguientes roles creados:
   - `admin` o `root`
   - `coordinador` o `coordinator`
   - `supervisor`
   - `socializador` o `socializer`

## 🐛 Solución de Problemas

### Error: "No se puede conectar a la API"

1. Verifica que el servidor backend esté ejecutándose
2. Verifica que la URL en `.env.local` sea correcta
3. Si usas ngrok, la URL puede haber expirado. Crea una nueva URL de ngrok

```bash
# En otro terminal, ejecuta:
ngrok http 3000
# Copia la URL y actualiza .env.local
```

### Error: "No se encontraron todos los roles necesarios"

1. Verifica que los roles estén creados en la base de datos
2. Comprueba que los nombres de los roles coincidan con los esperados
3. Ejecuta las migraciones de la base de datos si es necesario

### El script se detiene en mitad de la ejecución

1. Revisa si hay errores en los logs de la API
2. Verifica que el usuario autenticado tenga permisos para crear usuarios
3. Intenta nuevamente con una URL de API diferente

## 📝 Notas

- Las contraseñas son generadas automáticamente y siguen un patrón predefinido
- Todos los usuarios tienen status `enabled` por defecto
- Las encuestas se crean con datos de prueba mínimos (nombre, ID, teléfono, email)
- Los números de ID son secuenciales basados en rangos para evitar duplicados

## 🔧 Personalización

Si deseas modificar la estructura (ej: más socializadores, supervisores, etc.), edita el script `seed-hierarchy.ts` y modifica los bucles `for`:

```typescript
// Para crear más socializadores por supervisor, cambia esto:
for (let sIdx = 1; sIdx <= 2; sIdx++) {  // De 2 a 3, 4, etc.

// Para crear más supervisores por coordinador de campo, cambia esto:
// (actualmente crea 1, necesitarías agregar un bucle)
```

## 📞 Soporte

Si encuentras problemas, verifica:
1. Los logs de la API
2. La conexión a la base de datos
3. Los permisos del usuario autenticado
4. La validez de las credenciales en `.env.local`
