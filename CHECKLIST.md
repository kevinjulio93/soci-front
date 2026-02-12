# ✅ Checklist - Verificar que Todo Está Listo

## 🎯 Requisitos Previos

- [ ] Node.js está instalado (`node --version`)
- [ ] npm está instalado (`npm --version`)
- [ ] Backend está corriendo (`npm run dev` en carpeta del backend)
- [ ] Base de datos está disponible
- [ ] Los roles (admin, coordinador, supervisor, socializador) existen en la BD

---

## 📁 Archivos Verificación

### Scripts
- [ ] `scripts/seed-orchestrator.sh` existe
- [ ] `scripts/verify-api.ts` existe
- [ ] `scripts/seed-hierarchy-dry-run.ts` existe
- [ ] `scripts/seed-hierarchy.ts` existe
- [ ] `scripts/run-seed.sh` existe

### Documentación
- [ ] `SEEDING_README.md` existe (este archivo)
- [ ] `QUICK_START.md` existe
- [ ] `DIAGRAM.md` existe
- [ ] `SCRIPTS_GUIDE.md` existe
- [ ] `SEEDING_SUMMARY.md` existe
- [ ] `INDEX.md` existe
- [ ] `FINAL_SUMMARY.md` existe
- [ ] `SEEDING.md` existe

### Configuración
- [ ] `.env.local` existe
- [ ] `.env.example` existe
- [ ] API_BASE_URL está configurada en `.env.local`

---

## 🚀 Checklist de Ejecución

### Antes de Ejecutar
- [ ] Backend está corriendo
- [ ] Base de datos está disponible
- [ ] Roles existen en la BD
- [ ] `.env.local` tiene URL correcta

### Pasos Recomendados
- [ ] Leer QUICK_START.md (2 min)
- [ ] Ejecutar `./scripts/seed-orchestrator.sh` opción 1 (verificar)
- [ ] Ejecutar `./scripts/seed-orchestrator.sh` opción 2 (preview)
- [ ] Revisar `credentials-dry-run.csv`
- [ ] Copiar `credentials-dry-run.csv` a lugar seguro
- [ ] Ejecutar `./scripts/seed-orchestrator.sh` opción 4 (seeding real)

### Después de Ejecutar
- [ ] No hay errores en consola
- [ ] Mensaje "✨ SEEDING COMPLETADO EXITOSAMENTE"
- [ ] 11 usuarios creados
- [ ] 8 encuestas creadas

---

## 🔍 Validación de Datos

### Verificar en Base de Datos

**Usuarios:**
```bash
# Usar mongo o tu cliente BD
db.users.count()  # Debe ser más grande que antes
```

**Respondentes:**
```bash
db.respondents.count()  # Debe contar 8 más
```

### Verificar en la API

```bash
# Obtener todos los socializadores
curl http://localhost:3000/api/v1/socializers

# Obtener todos los respondentes
curl http://localhost:3000/api/v1/respondents

# Obtener todos los usuarios
curl http://localhost:3000/api/v1/users
```

### Verificar en la UI

- [ ] Ingresa con admin: `admin.test@soci.app / AdminTest123!`
- [ ] Ve a Admin Dashboard
- [ ] Verifica que existan los socializadores
- [ ] Verifica que existan las encuestas
- [ ] Prueba ingresar como un socializador

---

## 🐛 Troubleshooting

### Si falla la verificación de API

- [ ] Backend está corriendo?
- [ ] URL en `.env.local` es correcta?
- [ ] API está respondiendo a peticiones?

**Fix:**
```bash
# Reinicia backend
cd ../soci-backend
npm run dev
```

### Si no se encuentran roles

- [ ] Los roles existen en la BD?
- [ ] Los nombres de roles son correctos?
- [ ] La BD tiene datos?

**Fix:**
```bash
# Ver roles existentes
db.roles.find()

# O ejecutar migraciones
npm run migrate
```

### Si falla a mitad del seeding

- [ ] Revisa logs del backend
- [ ] Verifica usuario tiene permisos
- [ ] Intenta de nuevo

---

## 📊 Resultados Esperados

### Números
- [ ] 11 usuarios creados
- [ ] 8 respondentes creados
- [ ] 1 admin
- [ ] 2 coordinadores de zona
- [ ] 2 coordinadores de campo
- [ ] 2 supervisores
- [ ] 4 socializadores

### Estructura
- [ ] Jerarquía establecida correctamente
- [ ] Relaciones parent-child creadas
- [ ] Permisos asignados

### Datos
- [ ] Credenciales generadas
- [ ] `credentials-dry-run.csv` creado
- [ ] `hierarchy-dry-run.json` creado

---

## 💾 Backup y Seguridad

- [ ] `credentials-dry-run.csv` guardado en lugar seguro
- [ ] Contraseñas anotadas en lugar seguro
- [ ] No compartir contraseñas por email/chat

---

## 📝 Documentación

- [ ] QUICK_START.md leído
- [ ] SCRIPTS_GUIDE.md disponible para referencia
- [ ] INDEX.md bookmarked
- [ ] Team tiene acceso a documentación

---

## 🎓 Conocimiento

- [ ] Entiendo cómo funciona el orchestrator
- [ ] Entiendo qué hace cada script
- [ ] Sé cómo modificar el seeding si necesito
- [ ] Sé cómo debuggear problemas

---

## ✨ Hito Final

- [ ] ¿Todo está funcionando?
  - [ ] Sí → ¡Listo para testear!
  - [ ] No → Revisar troubleshooting

---

## 🚀 Próximos Pasos

1. Si está TODO ✅: 
   ```bash
   npm run dev  # Iniciar la app
   # Ingresar con admin.test@soci.app / AdminTest123!
   ```

2. Si hay ⚠️:
   - Revisar sección "Troubleshooting"
   - Consultar [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md)
   - Revisar logs del backend

---

## 📞 Contacto y Ayuda

**Si necesitas ayuda:**
1. Revisa [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md#-solución-de-problemas)
2. Revisa [DIAGRAM.md](./DIAGRAM.md)
3. Consulta logs del backend
4. Verifica `.env.local`

---

**Checklist Versión:** 1.0  
**Última actualización:** Febrero 11, 2026  
**Estado:** ✅ Listo para usar

Completa este checklist antes de reportar problemas. Si TODO está ✅, el sistema está listo. 🚀
