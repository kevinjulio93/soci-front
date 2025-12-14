# Docker Deployment Guide

Este proyecto incluye configuración Docker para despliegue en producción.

## Archivos Docker

- **Dockerfile**: Configuración multi-stage con Node.js (build) y Nginx (producción)
- **nginx.conf**: Configuración personalizada de Nginx para SPA
- **.dockerignore**: Archivos excluidos de la imagen Docker

## Comandos Docker

### Construcción de la imagen

```bash
# Build básico
docker build -t soci-front:latest .

# Build con tag específico
docker build -t soci-front:v1.0.0 .
```

### Ejecución del contenedor

```bash
# Ejecutar en puerto 80
docker run -d -p 80:80 --name soci-app soci-front:latest

# Ejecutar en puerto personalizado (ej: 3000)
docker run -d -p 3000:80 --name soci-app soci-front:latest

# Ejecutar con logs visibles
docker run -p 80:80 --name soci-app soci-front:latest
```

### Gestión del contenedor

```bash
# Ver contenedores en ejecución
docker ps

# Ver logs
docker logs soci-app
docker logs -f soci-app  # Seguir logs en tiempo real

# Detener contenedor
docker stop soci-app

# Iniciar contenedor detenido
docker start soci-app

# Reiniciar contenedor
docker restart soci-app

# Eliminar contenedor
docker rm soci-app

# Eliminar imagen
docker rmi soci-front:latest
```

## Características del Dockerfile

### Etapa 1: Build (Node.js)
- Base: `node:20-alpine` (ligera)
- Instala dependencias con `npm ci --legacy-peer-deps`
- Ejecuta build de producción con Vite
- Genera archivos optimizados en `/app/dist`

### Etapa 2: Producción (Nginx)
- Base: `nginx:alpine` (ligera)
- Copia archivos build al directorio de Nginx
- Configuración personalizada para SPA
- Puerto expuesto: 80

## Características de nginx.conf

### Routing SPA
- `try_files` redirige todas las rutas a `index.html`
- Soporta React Router correctamente

### Caché
- **Assets estáticos** (JS, CSS, imágenes): 1 año
- **Service Worker**: Sin caché (siempre actualizado)

### Compresión
- Gzip habilitado para archivos de texto
- Reduce tamaño de transferencia significativamente

### Security Headers
- `X-Frame-Options`: Previene clickjacking
- `X-Content-Type-Options`: Previene MIME sniffing
- `X-XSS-Protection`: Protección XSS básica

## Docker Compose (Opcional)

Para proyectos más complejos con múltiples servicios:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

## Despliegue en la Nube

### Docker Hub

```bash
# Login
docker login

# Tag para Docker Hub
docker tag soci-front:latest username/soci-front:latest

# Push
docker push username/soci-front:latest
```

### Cloud Providers

- **AWS ECS/ECR**: Compatible con esta imagen
- **Google Cloud Run**: Compatible (puerto 80)
- **Azure Container Instances**: Compatible
- **DigitalOcean App Platform**: Compatible
- **Heroku**: Usar Dockerfile deployment

## Optimizaciones

### Tamaño de Imagen
- Multi-stage build reduce tamaño final (~25MB con nginx:alpine)
- `.dockerignore` evita copiar archivos innecesarios
- Solo archivos de producción en imagen final

### Performance
- Assets con cache de 1 año (versionados por Vite)
- Gzip reduce transferencia de red
- Nginx sirve archivos estáticos eficientemente

### Seguridad
- Imagen Alpine (menos superficie de ataque)
- Security headers configurados
- Service Worker sin caché (siempre actualizado)

## Troubleshooting

### Error: "Cannot find module"
```bash
# Limpiar caché y reconstruir
docker build --no-cache -t soci-front:latest .
```

### Puerto en uso
```bash
# Usar puerto diferente
docker run -d -p 8080:80 --name soci-app soci-front:latest
```

### Ver contenido del contenedor
```bash
# Entrar al contenedor
docker exec -it soci-app sh

# Ver archivos en nginx
ls -la /usr/share/nginx/html
```

### Logs de Nginx
```bash
# Errores
docker exec soci-app cat /var/log/nginx/error.log

# Accesos
docker exec soci-app cat /var/log/nginx/access.log
```

## Variables de Entorno

Si necesitas variables de entorno en build time:

```bash
# Build con ARG
docker build --build-arg VITE_API_URL=https://api.example.com -t soci-front:latest .
```

En Dockerfile agregar:
```dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
```

## Notas Adicionales

- El Service Worker está incluido y funcionará en producción
- IndexedDB y funcionalidad offline funcionan correctamente
- La aplicación es completamente estática después del build
- No se requiere Node.js en runtime (solo Nginx)
