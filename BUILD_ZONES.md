# Multi-Zone Build Configuration

Este proyecto soporta múltiples ambientes de producción, uno por cada zona geográfica.

## Zonas Disponibles

- **Zona 1**: Bogotá, Soacha, Fusagasugá, Girardot
- **Zona 2**: Chía, Zipaquirá, Cajicá, Tenjo, Sopó, Nemocón, Cota, Mosquera, Facatativá, Madrid, Funza, Tunja, Sogamoso, Duitama
- **Zona 3**: Medellín, Bello, Itagüí, Envigado, Turbo, Sabaneta, La Ceja, Cali, Palmira, Buenaventura, Jamundí, Yumbo, Candelaria
- **Zona 4**: Bucaramanga, Floridablanca, Barrancabermeja, Girón, Piedecuesta, Cúcuta, Villa del Rosario, Los Patios
- **Zona 5**: Barranquilla, Soledad

## Scripts de Build

```bash
# Build genérico (usa .env.production)
npm run build

# Builds por zona
npm run build:zona1
npm run build:zona2
npm run build:zona3
npm run build:zona4
npm run build:zona5
```

## Archivos de Configuración por Zona

Cada zona tiene su archivo `.env.production.zona[N]` con:
- URL del API específica: `https://zona[N]-api.contactodirectocol.com/api/v1`
- Nombre de la app: `SociApp - Zona [N]`
- Configuración de zona activa: `VITE_ACTIVE_ZONE=zona[N]`

## ¿Cómo funciona?

1. Cada archivo `.env.production.zona[N]` define `VITE_ACTIVE_ZONE`
2. El componente `SurveyForm.tsx` lee esta variable y filtra departamentos/municipios según la zona
3. El formulario solo muestra los municipios correspondientes a la zona activa

## Deployment

Para desplegar cada zona en su servidor correspondiente:

```bash
# Zona 1
npm run build:zona1
# Subir contenido de /dist a zona1.contactodirectocol.com

# Zona 2
npm run build:zona2
# Subir contenido de /dist a zona2.contactodirectocol.com

# ... y así sucesivamente
```

## Configurar URLs del API

Editar los archivos `.env.production.zona[N]` y cambiar:
```
VITE_API_BASE_URL=https://tu-api-zona[N].com/api/v1
```
