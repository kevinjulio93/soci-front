# 📊 Diagrama de Flujo y Jerarquía

## 🔄 Flujo de Ejecución

```
┌─────────────────────────────────────────────────────────────┐
│        INICIO: ./scripts/seed-orchestrator.sh              │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴──────────┬──────────────┬──────────────┐
         │                      │              │              │
         ▼                      ▼              ▼              ▼
    [Opción 1]          [Opción 2]       [Opción 3]    [Opción 4]
   Verificar API       Ver Preview    Verificar +    Ejecutar
   (verify-api.ts)  (dry-run.ts)     Preview Real   (seed.ts)
         │                │              │              │
         ▼                ▼              ▼              ▼
    ✅ Conectividad   📋 CSV/JSON      ✅ + 📋       🚀 CREAR
    ✅ Roles          📊 Estructura     CONFIRMACIÓN   DATOS
    ✅ Endpoints      📝 Credenciales
         │                │              │              │
         └────────────────┴──────────────┴──────────────┘
                          │
                          ▼
              ✨ PROCESO COMPLETADO
```

---

## 👥 Jerarquía de Usuarios

```
                              ┌─────────────┐
                              │   ROOT DB   │
                              └──────┬──────┘
                                     │
                                     ▼
                            ┌────────────────┐
                            │    ADMIN       │
                            │   (1 usuario)  │
                            └────────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                                 │
                    ▼                                 ▼
        ┌──────────────────────┐        ┌──────────────────────┐
        │ COORDINADOR ZONA 1   │        │ COORDINADOR ZONA 2   │
        └──────────┬───────────┘        └──────────┬───────────┘
                   │                               │
                   ▼                               ▼
        ┌──────────────────────┐        ┌──────────────────────┐
        │ COORDINADOR CAMPO 1  │        │ COORDINADOR CAMPO 2  │
        └──────────┬───────────┘        └──────────┬───────────┘
                   │                               │
                   ▼                               ▼
        ┌──────────────────────┐        ┌──────────────────────┐
        │   SUPERVISOR 1       │        │   SUPERVISOR 2       │
        └──────────┬───────────┘        └──────────┬───────────┘
                   │                               │
        ┌──────────┴──────────┐        ┌──────────┴──────────┐
        │                     │        │                     │
        ▼                     ▼        ▼                     ▼
    ┌────────────┐      ┌────────────┐ ┌────────────┐  ┌────────────┐
    │SOCIALIZADO │      │SOCIALIZADO │ │SOCIALIZADO │  │SOCIALIZADO │
    │    1       │      │     2      │ │     3      │  │     4      │
    │  (2 encu)  │      │ (2 encu)   │ │ (2 encu)   │  │ (2 encu)   │
    └────────────┘      └────────────┘ └────────────┘  └────────────┘
```

---

## 📋 Datos Creados por Nivel

### Nivel 0: Admin
```
┌─────────────────────────────────────────┐
│ EMAIL: admin.test@soci.app              │
│ PASS:  AdminTest123!                    │
│ ROLE:  Admin                            │
│ Total: 1                                │
└─────────────────────────────────────────┘
```

### Nivel 1: Coordinadores de Zona
```
┌─────────────────────────────────────────┐
│ 1. zone.coordinator.1@soci.app          │
│    Pass: ZoneCoord1Test123!             │
│    Role: Coordinador                    │
│                                         │
│ 2. zone.coordinator.2@soci.app          │
│    Pass: ZoneCoord2Test123!             │
│    Role: Coordinador                    │
│ Total: 2                                │
└─────────────────────────────────────────┘
```

### Nivel 2: Coordinadores de Campo
```
┌─────────────────────────────────────────┐
│ 1. field.coordinator.zone1@soci.app     │
│    Pass: FieldCoord1Test123!            │
│    Role: Coordinador                    │
│    Reporte: Zona 1                      │
│                                         │
│ 2. field.coordinator.zone2@soci.app     │
│    Pass: FieldCoord2Test123!            │
│    Role: Coordinador                    │
│    Reporte: Zona 2                      │
│ Total: 2                                │
└─────────────────────────────────────────┘
```

### Nivel 3: Supervisores
```
┌─────────────────────────────────────────┐
│ 1. supervisor.zone1@soci.app            │
│    Pass: Supervisor1Test123!            │
│    Role: Supervisor                     │
│    Reporte: Campo 1 / Zona 1            │
│                                         │
│ 2. supervisor.zone2@soci.app            │
│    Pass: Supervisor2Test123!            │
│    Role: Supervisor                     │
│    Reporte: Campo 2 / Zona 2            │
│ Total: 2                                │
└─────────────────────────────────────────┘
```

### Nivel 4: Socializadores
```
┌─────────────────────────────────────────┐
│ ZONA 1:                                 │
│ 1. socializer.zone1_1@soci.app          │
│    Pass: Socializer1_1Test123!          │
│    Role: Socializador                   │
│    Supervisor: Supervisor 1             │
│    Encuestas: 2 (IDs: 1, 2)             │
│                                         │
│ 2. socializer.zone1_2@soci.app          │
│    Pass: Socializer1_2Test123!          │
│    Role: Socializador                   │
│    Supervisor: Supervisor 1             │
│    Encuestas: 2 (IDs: 3, 4)             │
│                                         │
│ ZONA 2:                                 │
│ 3. socializer.zone2_1@soci.app          │
│    Pass: Socializer2_1Test123!          │
│    Role: Socializador                   │
│    Supervisor: Supervisor 2             │
│    Encuestas: 2 (IDs: 5, 6)             │
│                                         │
│ 4. socializer.zone2_2@soci.app          │
│    Pass: Socializer2_2Test123!          │
│    Role: Socializador                   │
│    Supervisor: Supervisor 2             │
│    Encuestas: 2 (IDs: 7, 8)             │
│ Total: 4                                │
└─────────────────────────────────────────┘
```

### Nivel 5: Encuestas (Respondentes)
```
┌─────────────────────────────────────────┐
│ SOCIALIZADOR 1 (zone1_1):               │
│   ├─ Respondent 1                       │
│   │  Email: respondent.1@soci.app       │
│   │  ID: CC 3000000001                  │
│   └─ Respondent 2                       │
│      Email: respondent.2@soci.app       │
│      ID: CC 3000000002                  │
│                                         │
│ SOCIALIZADOR 2 (zone1_2):               │
│   ├─ Respondent 3                       │
│   │  Email: respondent.3@soci.app       │
│   │  ID: CC 3000000003                  │
│   └─ Respondent 4                       │
│      Email: respondent.4@soci.app       │
│      ID: CC 3000000004                  │
│                                         │
│ SOCIALIZADOR 3 (zone2_1):               │
│   ├─ Respondent 5                       │
│   │  Email: respondent.5@soci.app       │
│   │  ID: CC 3000000005                  │
│   └─ Respondent 6                       │
│      Email: respondent.6@soci.app       │
│      ID: CC 3000000006                  │
│                                         │
│ SOCIALIZADOR 4 (zone2_2):               │
│   ├─ Respondent 7                       │
│   │  Email: respondent.7@soci.app       │
│   │  ID: CC 3000000007                  │
│   └─ Respondent 8                       │
│      Email: respondent.8@soci.app       │
│      ID: CC 3000000008                  │
│ Total: 8                                │
└─────────────────────────────────────────┘
```

---

## 🔄 Ciclo de Vida del Seeding

```
1. VERIFICAR (verify-api.ts)
   ├─ Conexión API: ✅
   ├─ Roles: ✅
   └─ Endpoints: ✅

2. PREVISUALIZAR (dry-run.ts)
   ├─ Lee estructura
   ├─ Genera CSV
   ├─ Genera JSON
   └─ Muestra en consola

3. USUARIO REVISA
   ├─ Lee CSV
   ├─ Lee JSON
   └─ Decide continuar

4. CREAR (seed-hierarchy.ts)
   ├─ Crea Admin
   ├─ Crea Coordinadores Zona (2)
   ├─ Crea Coordinadores Campo (2)
   ├─ Crea Supervisores (2)
   ├─ Crea Socializadores (4)
   └─ Crea Encuestas (8)

5. VALIDAR
   ├─ Todos los usuarios creados
   ├─ Jerarquía establecida
   └─ Encuestas disponibles
```

---

## 📈 Estadísticas

```
Total Usuarios Creados:
┌────────────────────────┐
│ Admins         │ 1     │
│ Zona Coords    │ 2     │
│ Campo Coords   │ 2     │
│ Supervisores   │ 2     │
│ Socializadores │ 4     │
├────────────────────────┤
│ TOTAL          │ 11    │
└────────────────────────┘

Total Encuestas Creadas:
┌────────────────────────┐
│ Por Socializador │ 2    │
│ Socializadores   │ 4    │
├────────────────────────┤
│ TOTAL            │ 8    │
└────────────────────────┘

Tiempo Estimado:
┌────────────────────────┐
│ Verificación  │ 5s     │
│ Dry-run       │ 2s     │
│ Seeding Real  │ 30s    │
├────────────────────────┤
│ TOTAL         │ 37s    │
└────────────────────────┘
```

---

## 🎯 Casos de Uso por Rol

### Como Admin
```
admin.test@soci.app / AdminTest123!
├─ Ver todos los usuarios
├─ Ver todas las encuestas
├─ Ver reportes globales
└─ Gestionar roles
```

### Como Coordinador de Zona
```
zone.coordinator.1@soci.app / ZoneCoord1Test123!
├─ Ver coordinadores de campo
├─ Ver supervisores de su zona
├─ Ver socializadores de su zona
└─ Ver encuestas de su zona
```

### Como Supervisor
```
supervisor.zone1@soci.app / Supervisor1Test123!
├─ Ver socializadores de su grupo
├─ Ver encuestas de sus socializadores
└─ Generar reportes locales
```

### Como Socializador
```
socializer.zone1_1@soci.app / Socializer1_1Test123!
├─ Ver sus encuestas
├─ Crear respondentes
└─ Enviar datos de encuestas
```

---

## 🔐 Patrones de Contraseña

```
Admin:           AdminTest123!
Zona Coords:     ZoneCoord{N}Test123!
Campo Coords:    FieldCoord{N}Test123!
Supervisores:    Supervisor{N}Test123!
Socializadores:  Socializer{Z}_{S}Test123!

Donde:
N = Número secuencial
Z = Número de zona
S = Número de socializador
```

---

**Diagrama actualizado:** Febrero 11, 2026
**Versión:** 1.0

🚀 Para comenzar: `./scripts/seed-orchestrator.sh`
