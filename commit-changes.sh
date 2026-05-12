#!/bin/bash
# Script para hacer commit y push de los cambios del modulo de email
# Ejecutar en tu entorno local despues de hacer npm install

cd "$(dirname "$0")"

# Verificar que estamos en el repo correcto
if [ ! -d ".git" ]; then
  echo "Error: No estas en un repositorio git"
  exit 1
fi

echo "=== Resumen de cambios ==="
git diff --stat HEAD

echo ""
echo "=== Archivos nuevos ==="
git status --short | grep "^??" | sed 's/^?? //'

echo ""
echo "=== Instalando dependencias ==="
npm install

echo ""
echo "=== Haciendo commit ==="
git add -A
git commit -m "feat(email): add email confirmation module with PDF vouchers

- Add client_email_settings table to database schema
- Create email-settings-router for CRUD email configuration
- Create email-router with nodemailer + pdfmake for sending confirmations
- Auto-send email on booking creation via widget-router
- Add AdminEmailSettings component in panel admin
- Add Email tab to admin sidebar with EnvelopeSimple icon
- Add i18n translations (EN, ES, PT) for all email settings
- PDF voucher includes: company logo, passenger info, service details,
  vehicle type, payment summary, pickup instructions
- Supports both One Way and Round Trip formats
- Calculates suggested pickup time (3 hours before return flight)
- SMTP configuration with presets for Gmail, SendGrid, Mailgun, Outlook
- Toggle to enable/disable confirmation emails per client"

echo ""
echo "=== Haciendo push ==="
git push origin main

echo ""
echo "=== Para deploy en Railway ==="
echo "1. Ve a Railway dashboard"
echo "2. Add variables de entorno SMTP si usas un servicio externo"
echo "3. Deploy se hace automatico al hacer push"
