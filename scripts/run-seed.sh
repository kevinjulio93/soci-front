#!/bin/bash

# Script para ejecutar el seeding de la jerarquía de usuarios
# Instala dependencias necesarias y ejecuta el script de TypeScript

set -e

echo "📦 Instalando dependencias necesarias..."
npm install --save-dev node-fetch ts-node

echo "🚀 Compilando y ejecutando script de seeding..."
npx ts-node scripts/seed-hierarchy.ts
