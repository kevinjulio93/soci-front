# 🌱 Sistema de Seeding de SOCI

> Crea automáticamente una jerarquía completa de usuarios de prueba para la aplicación SOCI

## ⚡ Inicio Rápido

```bash
# 1. Asegúrate que el backend esté corriendo
cd ../soci-backend && npm run dev

# 2. En otra terminal, desde la carpeta sociFront
./scripts/seed-orchestrator.sh

# 3. Selecciona las opciones que necesites
```

**¡Eso es todo!** Los datos se crearán automáticamente.

---

## 📚 Documentación

| Documento | Tiempo | Propósito |
|-----------|--------|----------|
| [QUICK_START.md](./QUICK_START.md) | 2 min | Empezar en 30 segundos |
| [DIAGRAM.md](./DIAGRAM.md) | 5 min | Ver diagramas de estructura |
| [SEEDING_SUMMARY.md](./SEEDING_SUMMARY.md) | 5 min | Resumen de opciones |
| [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md) | 10 min | Guía completa detallada |
| [INDEX.md](./INDEX.md) | - | Índice de todos los recursos |
| [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) | - | Este resumen (TL;DR) |

---

## 🎯 Qué Se Crea

**11 Usuarios organizados jerárquicamente:**
```
1 Admin
├─ 2 Coordinadores de Zona
├─ 2 Coordinadores de Campo
├─ 2 Supervisores
└─ 4 Socializadores

8 Encuestas (2 por socializador)
```

**Credenciales:** Generadas automáticamente
- Admin: `admin.test@soci.app / AdminTest123!`
- Otros: Ver `credentials-dry-run.csv` después de ejecutar

---

## 🚀 Scripts Disponibles

### Menu Interactivo (RECOMENDADO)
```bash
./scripts/seed-orchestrator.sh
```
Interfaz amigable con opciones:
1. Verificar conectividad
2. Ver preview (sin cambios)
3. Hacer ambos
4. Ejecutar seeding real

### Scripts Individuales

**Verificar API:**
```bash
npx ts-node scripts/verify-api.ts
```

**Ver Preview:**
```bash
npx ts-node scripts/seed-hierarchy-dry-run.ts
```

**Crear Datos:**
```bash
npx ts-node scripts/seed-hierarchy.ts
```

---

## ⚙️ Configuración

El archivo `.env.local` contiene la URL de la API:
```env
API_BASE_URL=http://localhost:3000/api/v1
```

Para cambiar (ej: ngrok):
```bash
nano .env.local
```

---

## 💾 Archivos Generados

Después de ejecutar el dry-run:
- `credentials-dry-run.csv` - Todas las credenciales
- `hierarchy-dry-run.json` - Estructura en JSON

---

## 🔍 Flujo Recomendado

1. **Verificar** - Asegurar que todo está bien
   ```bash
   ./scripts/seed-orchestrator.sh  # Opción 1
   ```

2. **Previsualizar** - Ver exactamente qué se creará
   ```bash
   ./scripts/seed-orchestrator.sh  # Opción 2
   ```

3. **Revisar** - Abrir `credentials-dry-run.csv`
   ```bash
   cat credentials-dry-run.csv
   ```

4. **Ejecutar** - Crear los datos reales
   ```bash
   ./scripts/seed-orchestrator.sh  # Opción 4
   ```

5. **Validar** - Iniciar sesión y explorar
   - Email: `admin.test@soci.app`
   - Password: `AdminTest123!`

---

## 🐛 Solución de Problemas

### "No se puede conectar a la API"
- Verifica que el backend esté corriendo
- Verifica la URL en `.env.local`

### "No se encuentran roles"
- Los roles deben existir en la base de datos
- Ejecuta migraciones del backend si es necesario

### Más problemas
→ Ver [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md#-solución-de-problemas)

---

## 📋 Estructura de Carpetas

```
sociFront/
├── scripts/
│   ├── seed-orchestrator.sh        ← Menu interactivo (INICIO AQUI)
│   ├── verify-api.ts               ← Verificar API
│   ├── seed-hierarchy-dry-run.ts   ← Preview
│   ├── seed-hierarchy.ts           ← Crear datos
│   └── run-seed.sh                 ← Auxiliar
├── QUICK_START.md                  ← 30 segundos
├── DIAGRAM.md                      ← Diagramas
├── SCRIPTS_GUIDE.md                ← Guía completa
├── INDEX.md                        ← Índice
├── .env.local                      ← Configuración
└── ...otros archivos
```

---

## 🎓 Características

✅ Sistema de verificación robusto
✅ Preview seguro sin cambios
✅ Menú interactivo con confirmaciones
✅ Documentación completa
✅ Credenciales organizadas automáticamente
✅ Manejo de errores detallado
✅ Fácil de personalizar

---

## 🔐 Credenciales de Prueba

**Admin:**
```
Email: admin.test@soci.app
Password: AdminTest123!
```

**Patrón de otros usuarios:**
- Coordinadores: `{type}.coordinator.{n}@soci.app`
- Supervisores: `supervisor.zone{n}@soci.app`
- Socializadores: `socializer.zone{z}_{s}@soci.app`

Ver todas en `credentials-dry-run.csv`

---

## 💡 Pro Tips

1. **Siempre verifica primero** - Ejecuta opción 1 antes de hacer nada
2. **Usa el orchestrator** - Es más seguro que scripts directos
3. **Revisa el preview** - Entiende qué se va a crear
4. **Guarda credenciales** - Copia `credentials-dry-run.csv` a lugar seguro
5. **Lee los logs** - Si falla, revisa los logs de la API

---

## 📞 Soporte

**Para más información, consulta:**
- [QUICK_START.md](./QUICK_START.md) - Empezar rápido
- [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md) - Guía completa
- [DIAGRAM.md](./DIAGRAM.md) - Estructura visual
- [INDEX.md](./INDEX.md) - Índice de recursos

---

## 🚀 ¡Comienza Ahora!

```bash
./scripts/seed-orchestrator.sh
```

¡Selecciona la opción que necesites y disfruta! 🎉

---

**Ultima actualización:** Febrero 11, 2026  
**Versión:** 1.0  
**Estado:** ✅ Listo para producción
