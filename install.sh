#!/bin/bash
# Script para aplicar el modulo de email a Reservamos
# Ejecutar desde DENTRO de la carpeta Reservamos de tu computadora

set -e

echo "=========================================="
echo "  Reservamos - Email Module Installer"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(pwd)"

echo "Directorio del proyecto: $PROJECT_DIR"
echo "Directorio del update: $SCRIPT_DIR"
echo ""

# 1. Copiar archivos nuevos
echo "[1/4] Copiando archivos nuevos..."
mkdir -p "$PROJECT_DIR/api"
mkdir -p "$PROJECT_DIR/src/components/admin"

cp "$SCRIPT_DIR/api/email-settings-router.ts" "$PROJECT_DIR/api/email-settings-router.ts"
cp "$SCRIPT_DIR/api/email-router.ts" "$PROJECT_DIR/api/email-router.ts"
cp "$SCRIPT_DIR/src/components/admin/AdminEmailSettings.tsx" "$PROJECT_DIR/src/components/admin/AdminEmailSettings.tsx"
cp "$SCRIPT_DIR/.gitignore" "$PROJECT_DIR/.gitignore"
cp "$SCRIPT_DIR/Dockerfile" "$PROJECT_DIR/Dockerfile"
echo "  ✓ Archivos nuevos copiados"

# 2. Copiar archivos modificados
echo "[2/4] Copiando archivos modificados..."
cp "$SCRIPT_DIR/api/router.ts" "$PROJECT_DIR/api/router.ts"
cp "$SCRIPT_DIR/api/widget-router.ts" "$PROJECT_DIR/api/widget-router.ts"
cp "$SCRIPT_DIR/db/schema.ts" "$PROJECT_DIR/db/schema.ts"
cp "$SCRIPT_DIR/db/relations.ts" "$PROJECT_DIR/db/relations.ts"
cp "$SCRIPT_DIR/src/sections/AdminPanel.tsx" "$PROJECT_DIR/src/sections/AdminPanel.tsx"
cp "$SCRIPT_DIR/src/i18n/en.json" "$PROJECT_DIR/src/i18n/en.json"
cp "$SCRIPT_DIR/src/i18n/es.json" "$PROJECT_DIR/src/i18n/es.json"
cp "$SCRIPT_DIR/src/i18n/pt.json" "$PROJECT_DIR/src/i18n/pt.json"
cp "$SCRIPT_DIR/package.json" "$PROJECT_DIR/package.json"
echo "  ✓ Archivos modificados copiados"

# 3. Eliminar package-lock.json viejo
echo "[3/4] Limpiando package-lock.json..."
rm -f "$PROJECT_DIR/package-lock.json"
echo "  ✓ package-lock.json eliminado"

# 4. Instalar dependencias
echo "[4/4] Instalando dependencias nuevas (nodemailer, pdfmake)..."
cd "$PROJECT_DIR"
npm install
echo "  ✓ Dependencias instaladas"

echo ""
echo "=========================================="
echo "  Instalacion completada!"
echo "=========================================="
echo ""
echo "Ahora haz commit y push:"
echo "  git add -A"
echo "  git commit -m \"feat(email): add confirmation module with PDF vouchers\""
echo "  git push origin main"
echo ""
echo "Railway se deployara automaticamente."
echo ""
