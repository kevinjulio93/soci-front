# 📚 Índice de Recursos - Seeding de Usuarios

## 🎯 Acceso Rápido

### 🚀 Para Empezar Ahora
→ Lee: [QUICK_START.md](./QUICK_START.md) (2 min)
→ Ejecuta: `./scripts/seed-orchestrator.sh`

### 📖 Para Entender Todo
→ Lee: [SEEDING_SUMMARY.md](./SEEDING_SUMMARY.md) (5 min)
→ Lee: [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md) (10 min)

### ⚙️ Para Configurar
→ Edita: [.env.local](./.env.local)
→ Lee: [.env.example](./.env.example)

---

## 📁 Estructura de Archivos

```
sociFront/
├── 📄 QUICK_START.md              ← Inicia aquí (30 seg)
├── 📄 SEEDING_SUMMARY.md          ← Resumen general
├── 📄 SCRIPTS_GUIDE.md            ← Guía completa
├── 📄 SEEDING.md                  ← Doc. original
├── 📄 .env.local                  ← Configuración (editabilidad)
├── 📄 .env.example                ← Plantilla
│
└── scripts/
    ├── 🔍 verify-api.ts           ← Verificar conexión
    ├── 👀 seed-hierarchy-dry-run.ts ← Preview (sin cambios)
    ├── 🚀 seed-hierarchy.ts        ← Crear datos REALES
    ├── ⚙️ seed-orchestrator.sh     ← Menu interactivo
    └── 📝 run-seed.sh             ← Script helper
```

---

## 🎬 Scripts Disponibles

### 1. `verify-api.ts` 🔍
**Propósito:** Verificar que todo esté bien antes de ejecutar

**Verifica:**
- ✅ Conectividad con la API
- ✅ Disponibilidad de roles
- ✅ Endpoints clave

**Comando:**
```bash
npx ts-node scripts/verify-api.ts
```

**Uso recomendado:**
- Antes de cualquier seeding
- Para debuggear problemas de conexión

---

### 2. `seed-hierarchy-dry-run.ts` 👀
**Propósito:** Ver qué se creará SIN modificar la BD

**Genera:**
- Muestra completa de la jerarquía en consola
- `credentials-dry-run.csv` - Todas las credenciales
- `hierarchy-dry-run.json` - Estructura en JSON

**Comando:**
```bash
npx ts-node scripts/seed-hierarchy-dry-run.ts
```

**Uso recomendado:**
- Antes de ejecutar el seeding real
- Para verificar estructura y credenciales
- Para documentar qué se va a crear

---

### 3. `seed-hierarchy.ts` 🚀
**Propósito:** Crear los datos REALES en la API

**Crea:**
- 1 Admin
- 2 Coordinadores de Zona
- 2 Coordinadores de Campo
- 2 Supervisores
- 4 Socializadores
- 8 Encuestas

**Comando:**
```bash
npx ts-node scripts/seed-hierarchy.ts
```

**Advertencia:**
⚠️ MODIFICA LA BASE DE DATOS
⚠️ Ejecuta siempre con verify-api y dry-run antes

---

### 4. `seed-orchestrator.sh` ⚙️
**Propósito:** Menu interactivo que guía todo el proceso

**Opciones:**
1. Verificar API
2. Ver preview (dry-run)
3. Verificar + Preview
4. Ejecutar seeding REAL

**Comando:**
```bash
./scripts/seed-orchestrator.sh
```

**Uso recomendado:**
- Primera opción a usar siempre
- Más seguro que ejecutar scripts directamente
- Incluye confirmaciones

---

### 5. `run-seed.sh` 📝
**Propósito:** Script auxiliar para instalar dependencias

**Hace:**
- Instala `node-fetch` y `ts-node`
- Ejecuta `seed-hierarchy.ts`

**Comando:**
```bash
./scripts/run-seed.sh
```

---

## 📖 Documentación

### [QUICK_START.md](./QUICK_START.md) ⚡
- **Tiempo:** 2 minutos
- **Para:** Empezar rápido
- **Contiene:** 3 pasos simples

### [SEEDING_SUMMARY.md](./SEEDING_SUMMARY.md) 📊
- **Tiempo:** 5 minutos
- **Para:** Resumen de todo
- **Contiene:** Estructura, credenciales, troubleshooting

### [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md) 📚
- **Tiempo:** 10 minutos
- **Para:** Entender completamente
- **Contiene:** Guía paso a paso, ejemplos, FAQ

### [SEEDING.md](./SEEDING.md) 📝
- **Tiempo:** Variar
- **Para:** Referencia original
- **Contiene:** Documentación detallada

---

## ⚙️ Configuración

### `.env.local`
```env
API_BASE_URL=http://localhost:3000/api/v1
```

**Opciones comunes:**
```env
# Desarrollo local
API_BASE_URL=http://localhost:3000/api/v1

# ngrok (reemplaza con tu URL)
API_BASE_URL=https://xxxx-xxxx.ngrok-free.app/api/v1

# Producción
API_BASE_URL=https://api.tuseridor.com/api/v1
```

**Para cambiar:**
```bash
nano .env.local
```

---

## 🔐 Credenciales de Prueba

### Admin
```
Email: admin.test@soci.app
Password: AdminTest123!
```

### Otros Usuarios
Se generan automáticamente con patrón:
- Coordinadores: `zone/field.coordinator.{n}@soci.app`
- Supervisores: `supervisor.zone{n}@soci.app`
- Socializadores: `socializer.zone{z}_{s}@soci.app`

**Ver todas las credenciales:**
1. Ejecuta: `npx ts-node scripts/seed-hierarchy-dry-run.ts`
2. Abre: `credentials-dry-run.csv`

---

## 🚀 Flujo Recomendado

```
1. LEER
   └─ QUICK_START.md (2 min)

2. VERIFICAR
   └─ ./scripts/seed-orchestrator.sh → Opción 1

3. PREVISUALIZAR
   └─ ./scripts/seed-orchestrator.sh → Opción 2

4. REVISAR ARCHIVOS GENERADOS
   └─ credentials-dry-run.csv
   └─ hierarchy-dry-run.json

5. EJECUTAR
   └─ ./scripts/seed-orchestrator.sh → Opción 4

6. VERIFICAR RESULTADOS
   └─ Inicia sesión en la app
   └─ Ve al dashboard
```

---

## 🐛 Troubleshooting

### "No se puede conectar a la API"
→ [Ver solución](./SCRIPTS_GUIDE.md#-solución-de-problemas)

### "No se encuentran roles"
→ [Ver solución](./SCRIPTS_GUIDE.md#-solución-de-problemas)

### "Error a mitad del seeding"
→ [Ver solución](./SCRIPTS_GUIDE.md#-solución-de-problemas)

### "URL de ngrok expirada"
→ [Ver solución](./SCRIPTS_GUIDE.md#-solución-de-problemas)

---

## 📊 Lo Que Se Creará

```
ADMIN (1)
├─ COORDINADOR ZONA 1
│  ├─ COORDINADOR CAMPO 1
│  │  ├─ SUPERVISOR 1
│  │  │  ├─ SOCIALIZADOR 1 → 2 encuestas
│  │  │  └─ SOCIALIZADOR 2 → 2 encuestas
│
├─ COORDINADOR ZONA 2
│  ├─ COORDINADOR CAMPO 2
│  │  ├─ SUPERVISOR 2
│  │  │  ├─ SOCIALIZADOR 3 → 2 encuestas
│  │  │  └─ SOCIALIZADOR 4 → 2 encuestas
```

**TOTALES:**
- 1 Admin
- 2 Coordinadores de Zona
- 2 Coordinadores de Campo
- 2 Supervisores
- 4 Socializadores
- 8 Encuestas

---

## 💡 Tips Profesionales

1. **Guarda credenciales después del dry-run**
   ```bash
   cp credentials-dry-run.csv ~/backups/
   ```

2. **Usa el orchestrator, no los scripts directos**
   - Es más seguro
   - Tiene confirmaciones
   - Mejor UX

3. **Siempre verifica primero**
   ```bash
   ./scripts/seed-orchestrator.sh  # Opción 1
   ```

4. **Lee dry-run antes de ejecutar**
   ```bash
   ./scripts/seed-orchestrator.sh  # Opción 2
   ```

5. **Automatiza si es posible**
   - Los scripts están diseñados para CI/CD
   - Puedes pasar variables de entorno
   - Modifica según necesites

---

## 📞 Soporte

### Pasos para debuggear:
1. Abre [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md)
2. Busca el error en "Solución de Problemas"
3. Sigue los pasos indicados

### Si nada funciona:
1. Verifica logs del backend
2. Revisa configuración en `.env.local`
3. Intenta con `verify-api.ts`
4. Consulta la documentación completa

---

## 🔄 Próximos Pasos

```bash
# 1. Abre el orchestrator
./scripts/seed-orchestrator.sh

# 2. Selecciona opción 1 (verificar)
# 3. Selecciona opción 2 (preview)
# 4. Selecciona opción 4 (ejecutar)

# ¡Listo!
```

---

**Ultima actualización:** Febrero 11, 2026
**Versión:** 1.0
**Estado:** ✅ Listo para uso

🚀 ¡Comienza con [QUICK_START.md](./QUICK_START.md)!
