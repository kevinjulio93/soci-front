# 🚀 Quick Start - Seeding en 30 Segundos

## ⚡ 3 Pasos Simples

### 1️⃣ Asegúrate que el Backend Esté Corriendo
```bash
# En otra terminal:
cd /ruta/del/backend
npm run dev
# o
docker-compose up
```

### 2️⃣ Abre el Menú Interactivo
```bash
cd /Users/kevinPersona/Documents/projects/soci-app/sociFront
./scripts/seed-orchestrator.sh
```

### 3️⃣ Selecciona Opción 4 (Seeding Real)
```
╔════════════════════════════════════════════════════════════════╗
║          🌱 ORQUESTADOR DE SEEDING DE USUARIOS 🌱             ║
╚════════════════════════════════════════════════════════════════╝

¿Qué deseas hacer?

1️⃣  Verificar conectividad con la API
2️⃣  Ver preview de la jerarquía (dry-run)
3️⃣  Hacer todo: verificar + preview
4️⃣  Ejecutar seeding REAL (⚠️ Creará datos en la BD)

Selecciona una opción (1-4): 4
```

---

## ✅ Cuando Termines

Verás esto:
```
✨ SEEDING COMPLETADO EXITOSAMENTE
════════════════════════════════════════════════════════════════

📊 RESUMEN:
  👤 Admins: 1
  🏢 Coordinadores de Zona: 2
  🏭 Coordinadores de Campo: 2
  👨‍💼 Supervisores: 2
  👥 Socializadores: 4
  📝 Encuestas: 8

🔑 CREDENCIALES:
  Email: admin.test@soci.app
  Password: AdminTest123!
```

---

## 🔐 Usar el Admin

1. Abre la app: `http://localhost:5173` (o tu URL)
2. Haz clic en "Login"
3. Ingresa:
   - Email: `admin.test@soci.app`
   - Password: `AdminTest123!`
4. ¡Listo! Verás el dashboard con todos los datos

---

## 👁️ Ver Qué se Creará ANTES de Ejecutar

```bash
./scripts/seed-orchestrator.sh
# Selecciona opción 2
```

Esto mostrará exactamente qué se creará sin tocar la BD.

---

## 🔍 Verificar que Todo Esté Bien

```bash
./scripts/seed-orchestrator.sh
# Selecciona opción 1
```

Comprobará que:
- ✅ La API está accesible
- ✅ Los roles existen
- ✅ Los endpoints funcionan

---

## 📞 ¿Problemas?

| Error | Fix |
|-------|-----|
| "No se puede conectar a la API" | Backend no está corriendo. Ejecuta `npm run dev` en el backend |
| "No se encontraron roles" | Los roles no existen en la BD |
| "URL expirada" | Si usas ngrok, genera nueva URL y actualiza `.env.local` |

---

## 📚 Documentos Útiles

- **Guía Completa:** [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md)
- **Documentación Seeding:** [SEEDING.md](./SEEDING.md)
- **Resumen:** [SEEDING_SUMMARY.md](./SEEDING_SUMMARY.md)

---

## 🎯 Lo que se Creará

```
├─ 1 Admin
├─ 2 Coordinadores de Zona
├─ 2 Coordinadores de Campo
├─ 2 Supervisores
├─ 4 Socializadores
└─ 8 Encuestas
```

**Total: 11 usuarios + 8 encuestas**

---

**¡Ejecuta este comando y listo!**

```bash
./scripts/seed-orchestrator.sh
```

🚀
