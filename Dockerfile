# Etapa 1: Build
FROM node:20-alpine AS builder

# Argumentos de build
ARG BUILD_ENV=production

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar el resto del código
COPY . .

# Build con el ambiente especificado
RUN npm run build:${BUILD_ENV}

# Etapa 2: Producción con PM2
FROM node:20-alpine

# Instalar PM2 y serve globalmente
RUN npm install -g pm2 serve

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos build desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Copiar configuración de PM2
COPY ecosystem.config.js ./

# Exponer puerto 5000
EXPOSE 5000

# Comando por defecto - iniciar con PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
