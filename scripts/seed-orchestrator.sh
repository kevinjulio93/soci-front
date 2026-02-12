#!/bin/bash

# Script de Orquestación - Todo en Uno
# Ejecuta verify-api + seed-hierarchy-dry-run en secuencia

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🌱 ORQUESTADOR DE SEEDING DE USUARIOS 🌱             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📍 Ubicación del proyecto:${NC}"
pwd
echo ""

# Menu
echo "¿Qué deseas hacer?"
echo ""
echo "1️⃣  Verificar conectividad con la API"
echo "2️⃣  Ver preview de la jerarquía (dry-run)"
echo "3️⃣  Hacer todo: verificar + preview"
echo "4️⃣  Ejecutar seeding REAL (⚠️ Creará datos en la BD)"
echo ""
read -p "Selecciona una opción (1-4): " option

case $option in
  1)
    echo ""
    echo -e "${BLUE}🔍 Ejecutando verificación de API...${NC}"
    npx ts-node scripts/verify-api.ts
    ;;
  2)
    echo ""
    echo -e "${BLUE}👀 Mostrando preview de la jerarquía...${NC}"
    npx ts-node scripts/seed-hierarchy-dry-run.ts
    ;;
  3)
    echo ""
    echo -e "${BLUE}🔍 Paso 1: Verificando API...${NC}"
    npx ts-node scripts/verify-api.ts
    echo ""
    echo -e "${BLUE}👀 Paso 2: Mostrando preview...${NC}"
    npx ts-node scripts/seed-hierarchy-dry-run.ts
    ;;
  4)
    echo ""
    echo -e "${YELLOW}⚠️  ADVERTENCIA: Esto creará datos REALES en la base de datos${NC}"
    echo ""
    echo "Se crearán:"
    echo "  • 1 Admin"
    echo "  • 2 Coordinadores de Zona"
    echo "  • 2 Coordinadores de Campo"
    echo "  • 2 Supervisores"
    echo "  • 4 Socializadores"
    echo "  • 8 Encuestas"
    echo ""
    read -p "¿Estás seguro? (s/n): " confirm
    
    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      echo ""
      echo -e "${GREEN}🚀 Iniciando seeding real...${NC}"
      npx ts-node scripts/seed-hierarchy.ts
      echo ""
      echo -e "${GREEN}✨ ¡Seeding completado!${NC}"
      echo ""
      echo "📋 Credenciales principales:"
      echo "   Admin: admin.test@soci.app / AdminTest123!"
      echo ""
      echo "🔗 Próximos pasos:"
      echo "   1. Inicia sesión en la aplicación"
      echo "   2. Ve al Dashboard de Admin"
      echo "   3. Explora los usuarios y encuestas creadas"
    else
      echo -e "${RED}❌ Cancelado${NC}"
    fi
    ;;
  *)
    echo -e "${RED}❌ Opción no válida${NC}"
    exit 1
    ;;
esac

echo ""
