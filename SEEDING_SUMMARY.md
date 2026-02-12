# ✨ Seeding de Usuarios - Resumen Final

## 📦 Lo que se ha creado

Se han desarrollado **4 scripts completos** para generar automáticamente una jerarquía de usuarios y encuestas de prueba:

### Scripts Disponibles:

1. **`verify-api.ts`** 🔍
   - Verifica que la API esté disponible
   - Valida que existan todos los roles necesarios
   - Comprueba los endpoints clave
   - **Uso:** `npx ts-node scripts/verify-api.ts`

2. **`seed-hierarchy-dry-run.ts`** 👀
   - Muestra la estructura que se creará SIN modificar la BD
   - Genera archivos CSV y JSON con los datos
   - Perfecto para previsualizar antes de ejecutar
   - **Uso:** `npx ts-node scripts/seed-hierarchy-dry-run.ts`

3. **`seed-hierarchy.ts`** 🚀
   - Crea los datos REALES en la API
   - Genera toda la jerarquía de usuarios
   - Crea las encuestas automáticamente
   - **Uso:** `npx ts-node scripts/seed-hierarchy.ts`

4. **`seed-orchestrator.sh`** ⚙️
   - Script interactivo que coordina todo
   - Menu para elegir qué ejecutar
   - Incluye confirmaciones de seguridad
   - **Uso:** `./scripts/seed-orchestrator.sh`

---

## 📊 Estructura Jerárquica

```
1 ADMIN
├─ 2 COORDINADORES DE ZONA
   ├─ 1 COORDINADOR DE CAMPO (cada uno)
   │  ├─ 1 SUPERVISOR
   │  │  ├─ 2 SOCIALIZADORES
   │  │  │  └─ 2 ENCUESTAS (cada uno)
```

**Totales:**
- **1** Admin
- **2** Coordinadores de Zona
- **2** Coordinadores de Campo
- **2** Supervisores
- **4** Socializadores
- **8** Encuestas

---

## 🚀 Inicio Rápido (Recomendado)

```bash
# Paso 1: Cambiar a la carpeta
cd /Users/kevinPersona/Documents/projects/soci-app/sociFront

# Paso 2: Ejecutar el orquestador (interfaz interactiva)
./scripts/seed-orchestrator.sh

# Paso 3: Seleccionar opción 3 o 4 del menú
```

---

## 📋 Flujo Completo Recomendado

```bash
# 1. Verifica que todo esté bien
npx ts-node scripts/verify-api.ts

# 2. Ve qué se creará (sin crear nada)
npx ts-node scripts/seed-hierarchy-dry-run.ts

# 3. Revisa los archivos generados
cat credentials-dry-run.csv
cat hierarchy-dry-run.json

# 4. Cuando estés listo, crea los datos reales
npx ts-node scripts/seed-hierarchy.ts
```

---

## 🔐 Credenciales de Prueba

### Admin Principal
```
Email: admin.test@soci.app
Password: AdminTest123!
```

### Ejemplo de Socializador
```
Email: socializer.zone1_1@soci.app
Password: Socializer1_1Test123!
```

**Todas las credenciales se generan en:**
- `credentials-dry-run.csv` (después del dry-run)
- Se muestran en consola después del seeding real

---

## ⚙️ Configuración

### `.env.local`
Ya está creado y contiene:
```env
API_BASE_URL=http://localhost:3000/api/v1
```

**Si necesitas cambiar la URL:**
```bash
# Editar el archivo
nano .env.local

# Ejemplos:
# API_BASE_URL=https://tu-ngrok-url.ngrok-free.app/api/v1
# API_BASE_URL=https://api.tuseridor.com/api/v1
```

---

## 📁 Archivos Generados

Después del dry-run:
- **`credentials-dry-run.csv`** - Todas las credenciales en formato tabla
- **`hierarchy-dry-run.json`** - Estructura completa en JSON

---

## 🐛 Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| "No se puede conectar a la API" | Inicia el backend: `npm run dev` (en carpeta del backend) |
| "No se encontraron roles" | Los roles deben existir en la BD. Verifica con: `db.roles.find()` |
| "URL de ngrok expirada" | Crea nueva URL: `ngrok http 3000` y actualiza `.env.local` |
| Error a mitad del seeding | Revisa logs del backend, intenta de nuevo |

---

## 📖 Documentación Completa

Para más detalles, ver:
- **[SEEDING.md](./SEEDING.md)** - Documentación original del seeding
- **[SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md)** - Guía completa con ejemplos
- **[.env.example](./.env.example)** - Plantilla de variables de entorno

---

## 🎯 Casos de Uso

### Para Testear la UI
```bash
./scripts/seed-orchestrator.sh
# Seleccionar opción 4
# Usar credenciales del admin
```

### Para Ver los Datos Primero
```bash
npx ts-node scripts/seed-hierarchy-dry-run.ts
# Revisar los archivos CSV/JSON
# Luego decidir si ejecutar el real
```

### Para Verificar Conectividad
```bash
npx ts-node scripts/verify-api.ts
# Garantiza que todo esté correctamente configurado
```

### Para Automatizar (CI/CD)
```bash
# Usar sin confirmaciones interactivas
API_BASE_URL=https://tu-api.com npx ts-node scripts/seed-hierarchy.ts
```

---

## 💡 Pro Tips

1. **Guarda las credenciales**: Después del dry-run, copia `credentials-dry-run.csv` a un lugar seguro
2. **Usa el orchestrator**: Es más seguro y tiene confirmaciones
3. **Verifica primero**: Siempre ejecuta `verify-api.ts` antes de `seed-hierarchy.ts`
4. **Consulta dry-run**: Úsalo para entender exactamente qué se creará
5. **Lee los logs**: Si falla, los logs de la API te dirán por qué

---

## 🔄 Próximos Pasos

1. **Asegúrate de que el backend esté corriendo**
   ```bash
   # En otra terminal
   cd ../soci-backend  # o donde sea tu backend
   npm run dev
   ```

2. **Ejecuta el orchestrator**
   ```bash
   ./scripts/seed-orchestrator.sh
   ```

3. **Inicia sesión en la app con el admin**
   ```
   Email: admin.test@soci.app
   Password: AdminTest123!
   ```

4. **Explora los datos creados**
   - Ve a Admin Dashboard
   - Revisa los Socializadores creados
   - Abre una encuesta y verifica los datos

---

## 🎓 Estructura de Código

Los scripts están bien documentados con:
- Funciones tipadas con TypeScript
- Comentarios explicativos
- Manejo de errores robusto
- Mensajes de progreso claros
- Validación de entrada

**Puedes estudiar y modificar los scripts según tus necesidades.**

---

**¡Listo para generar datos de prueba! 🚀**

Ejecuta: `./scripts/seed-orchestrator.sh`
