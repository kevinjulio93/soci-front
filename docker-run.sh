#!/bin/bash

# Script para ejecutar el contenedor Docker de soci-front

# Variables
IMAGE_NAME="soci-front"
CONTAINER_NAME="soci-app"
PORT=5000

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando contenedor soci-front...${NC}"

# Verificar si el contenedor ya existe
if [ "$(docker ps -a -q -f name=^${CONTAINER_NAME}$)" ]; then
    echo -e "${YELLOW}El contenedor '${CONTAINER_NAME}' ya existe${NC}"
    echo -e "${YELLOW}Eliminando contenedor existente...${NC}"
    docker rm -f ${CONTAINER_NAME}
fi

# Ejecutar el contenedor
echo -e "${GREEN}Ejecutando contenedor en puerto ${PORT}...${NC}"

docker run -d \
  --name ${CONTAINER_NAME} \
  -p ${PORT}:5000 \
  --restart unless-stopped \
  ${IMAGE_NAME}:latest

# Verificar si el contenedor se inició correctamente
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Contenedor iniciado exitosamente${NC}"
    echo -e "${GREEN}Aplicación disponible en: http://localhost:${PORT}${NC}"
    echo ""
    echo -e "${YELLOW}Comandos útiles:${NC}"
    echo "  - Ver logs:       docker logs -f ${CONTAINER_NAME}"
    echo "  - Ver estado:     docker ps"
    echo "  - Detener:        docker stop ${CONTAINER_NAME}"
    echo "  - Reiniciar:      docker restart ${CONTAINER_NAME}"
    echo "  - Eliminar:       docker rm -f ${CONTAINER_NAME}"
    echo "  - Ver PM2:        docker exec ${CONTAINER_NAME} pm2 status"
else
    echo -e "${RED}Error al iniciar el contenedor${NC}"
    exit 1
fi
