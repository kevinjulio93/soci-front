# 📚 Guía Completa: Script de Seeding de Usuarios y Encuestas

## 🎯 Resumen Rápido

Se han creado **3 scripts de utilidad** para generar automáticamente una jerarquía completa de usuarios de prueba:

```
1️⃣ verify-api.ts          ← Verificar conectividad con la API
2️⃣ seed-hierarchy-dry-run.ts ← Previsualizar la estructura
3️⃣ seed-hierarchy.ts      ← Crear los datos reales
```

---

## 📊 Estructura que se Creará

```
ADMIN (1)
├─ COORDINADOR ZONA 1
│  ├─ COORDINADOR CAMPO 1
│  │  ├─ SUPERVISOR 1
│  │  │  ├─ SOCIALIZADOR 1 (2 encuestas)
│  │  │  └─ SOCIALIZADOR 2 (2 encuestas)
├─ COORDINADOR ZONA 2
│  ├─ COORDINADOR CAMPO 2
│  │  ├─ SUPERVISOR 2
│  │  │  ├─ SOCIALIZADOR 3 (2 encuestas)
│  │  │  └─ SOCIALIZADOR 4 (2 encuestas)
```

**Total:**
- 1 Admin
- 2 Coordinadores de Zona
- 2 Coordinadores de Campo  
- 2 Supervisores
- 4 Socializadores
- 8 Encuestas

---

## 🚀 Instrucciones de Uso

### Paso 1: Preparar el Entorno

```bash
# Asegúrate de estar en la carpeta del proyecto
cd /Users/kevinPersona/Documents/projects/soci-app/sociFront

# El archivo .env.local ya existe con:
# API_BASE_URL=http://localhost:3000/api/v1

# Si necesitas cambiar la URL (ej: ngrok), edita .env.local:
nano .env.local
```

### Paso 2: Verificar Conectividad (Opcional pero Recomendado)

```bash
# Ejecutar antes de hacer el seeding real para verificar que todo esté bien
npx ts-node scripts/verify-api.ts
```

**Salida esperada:**
```
✅ API accesible
✅ Todos los roles necesarios están disponibles
✅ Endpoints clave disponibles
```

### Paso 3: Previsualizar la Estructura (Muy Recomendado)

```bash
# Ver exactamente qué se creará SIN hacer cambios en la BD
npx ts-node scripts/seed-hierarchy-dry-run.ts
```

**Salida:** 
- Muestra toda la jerarquía con credenciales
- Genera `credentials-dry-run.csv` con todas las credenciales
- Genera `hierarchy-dry-run.json` con la estructura en JSON

### Paso 4: Ejecutar el Seeding Real

```bash
# Crear los datos en la API
npx ts-node scripts/seed-hierarchy.ts
```

**Resultado esperado:**
- ✅ Todos los usuarios creados
- ✅ Todas las encuestas creadas
- ✅ Jerarquía establecida correctamente

---

## 🔐 Credenciales Generadas

### Admin Principal
```
Email: admin.test@soci.app
Password: AdminTest123!
```

### Coordinadores de Zona
```
1. zone.coordinator.1@soci.app / ZoneCoord1Test123!
2. zone.coordinator.2@soci.app / ZoneCoord2Test123!
```

### Coordinadores de Campo
```
1. field.coordinator.zone1@soci.app / FieldCoord1Test123!
2. field.coordinator.zone2@soci.app / FieldCoord2Test123!
```

### Supervisores
```
1. supervisor.zone1@soci.app / Supervisor1Test123!
2. supervisor.zone2@soci.app / Supervisor2Test123!
```

### Socializadores (Ejemplo)
```
Zone 1:
  - socializer.zone1_1@soci.app / Socializer1_1Test123!
  - socializer.zone1_2@soci.app / Socializer1_2Test123!

Zone 2:
  - socializer.zone2_1@soci.app / Socializer2_1Test123!
  - socializer.zone2_2@soci.app / Socializer2_2Test123!
```

---

## 📁 Archivos Generados

### Después del Dry Run:
```
credentials-dry-run.csv    ← Todas las credenciales en CSV
hierarchy-dry-run.json     ← Estructura en formato JSON
```

### Ejemplo de contenido (CSV):
```
Tipo,Nombre,Email,Contraseña,ID,Nivel
Admin,Admin Test,admin.test@soci.app,AdminTest123!,admin-1,0
Coordinador de Zona,Coordinador Zona 1,zone.coordinator.1@soci.app,ZoneCoord1Test123!,zone-coord-1,1
...
```

---

## ⚙️ Archivos de Configuración

### `.env.local`
Contiene la URL base de la API:
```env
API_BASE_URL=http://localhost:3000/api/v1
```

**Alternativas de URL:**
- **Desarrollo local:** `http://localhost:3000/api/v1`
- **ngrok:** `https://xxxx-xxxx-xxxx.ngrok-free.app/api/v1`
- **Producción:** Tu URL de API

### `.env.example`
Plantilla de configuración (no editada directamente).

---

## 🔍 Verificación de Datos

### Después de ejecutar el seeding, puedes verificar:

1. **En la Base de Datos:**
   - 11 usuarios nuevos (1 admin + 2 coords zona + 2 coords campo + 2 supervisores + 4 socializadores)
   - 8 respondentes (encuestas)
   - Relaciones jerárquicas establecidas

2. **Mediante la API:**
   ```bash
   # Obtener todos los socializadores
   curl -X GET http://localhost:3000/api/v1/socializers
   
   # Obtener todos los respondentes
   curl -X GET http://localhost:3000/api/v1/respondents
   ```

3. **Mediante la UI:**
   - Inicia sesión con `admin.test@soci.app / AdminTest123!`
   - Ve a Admin Dashboard → Socializers
   - Deberías ver los 4 socializadores creados

---

## 🐛 Solución de Problemas

### ❌ "No se puede conectar a la API"

**Causa:** El servidor backend no está corriendo o la URL es incorrecta.

**Soluciones:**
1. **Inicia el backend:**
   ```bash
   # En otra terminal, en la carpeta del backend
   cd /ruta/al/backend
   npm run dev
   # o
   docker-compose up
   ```

2. **Verifica la URL:**
   ```bash
   # Si usas ngrok, obtén una nueva URL:
   ngrok http 3000
   
   # Actualiza .env.local con la nueva URL:
   API_BASE_URL=https://nueva-url.ngrok-free.app/api/v1
   ```

3. **Verifica conectividad:**
   ```bash
   curl http://localhost:3000/api/v1/roles
   ```

---

### ❌ "No se encontraron todos los roles necesarios"

**Causa:** Los roles no existen en la base de datos.

**Soluciones:**
1. **Verifica los roles en la BD:**
   ```bash
   # En la consola del backend o BD:
   db.roles.find()
   ```

2. **Crea los roles si faltan:**
   ```json
   {
     "role": "admin",
     "permissions": []
   },
   {
     "role": "coordinador",
     "permissions": []
   },
   {
     "role": "supervisor",
     "permissions": []
   },
   {
     "role": "socializador",
     "permissions": []
   }
   ```

3. **O ejecuta migraciones:**
   ```bash
   # En el backend
   npm run migrate
   ```

---

### ❌ Error a mitad del seeding

**Causa:** Problema de conectividad o permisos durante la ejecución.

**Soluciones:**
1. **Revisa los logs del backend** para ver qué error ocurrió
2. **Verifica que el usuario admin tenga permisos** para crear usuarios
3. **Intenta de nuevo** - a veces es error temporal de red

---

## 📊 Datos de Prueba

### Respondentes (Encuestados)
Se crean 8 respondentes automáticamente:
- **Nombre:** `Respondent - {socializer.email} #{survey_num}`
- **ID Type:** CC (Cédula de Ciudadanía)
- **ID Number:** CC 3000000001 a CC 3000000008 (secuencial)
- **Email:** respondent.1@soci.app a respondent.8@soci.app
- **Ciudad:** Bogotá
- **Estrato:** 3

Puedes editar el script si necesitas diferentes datos.

---

## 🔄 Scripts para Personalización

### Para crear más estructuras (ej: 3 socializadores por supervisor)

Edita `scripts/seed-hierarchy.ts`:

```typescript
// Cambiar de:
for (let sIdx = 1; sIdx <= 2; sIdx++) {  // 2 socializadores

// A:
for (let sIdx = 1; sIdx <= 3; sIdx++) {  // 3 socializadores
```

### Para cambiar el número de zonas/supervisores

Edita `scripts/seed-hierarchy.ts`:

```typescript
// Para 3 zonas:
for (let i = 1; i <= 3; i++) {  // Cambiar de 2 a 3

// Esto requeriría agregar más bucles anidados
```

---

## 📞 Flujo Completo Recomendado

```mermaid
1. Configurar .env.local
   ↓
2. npx ts-node scripts/verify-api.ts
   ↓
3. npx ts-node scripts/seed-hierarchy-dry-run.ts
   ↓
4. Revisar credentials-dry-run.csv
   ↓
5. npx ts-node scripts/seed-hierarchy.ts
   ↓
6. Ingresar a la UI y validar
   ↓
7. ¡Listo para testear!
```

---

## 💾 Backup de Credenciales

Después de ejecutar el dry-run, se genera `credentials-dry-run.csv`.
**Importante:** Guarda este archivo en un lugar seguro o cópialo antes de ejecutar el seeding real.

```bash
# Copiar a un lugar seguro
cp credentials-dry-run.csv ~/Documents/soci-credentials-backup.csv
```

---

## 🎓 Próximos Pasos Después del Seeding

1. **Inicia sesión** con el admin
2. **Explora el dashboard** para ver los usuarios creados
3. **Abre una encuesta** como socializador
4. **Prueba el formulario** de encuesta
5. **Verifica los datos** en reportes

---

## 📖 Referencias

- [Documentación de SOCI - Seeding](../SEEDING.md)
- [Configuración de Variables de Entorno](../.env.example)
- [Archivo de Jerarquía (JSON)](../hierarchy-dry-run.json)
- [Credenciales de Prueba (CSV)](../credentials-dry-run.csv)

---

**¿Preguntas?** Revisa los scripts en `scripts/` - están bien comentados. 🚀
