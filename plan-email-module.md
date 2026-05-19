# Plan — Modulo Configurar Email + Confirmaciones con PDF

## Feature Completo
1. **Configurar Email** en panel admin (subject, mensaje generico, instrucciones de pickup)
2. **Envio automatico** de email al crear reserva (cliente + admin)
3. **PDF adjunto** con info completa de la reserva

## Estructura del PDF
- Logo de la empresa
- Nombre, sitio web y telefono de la empresa
- Nombre del Cliente / Telefono / Email / Clave de Reservacion
- Servicio contratado (One Way / Round Trip)
- Otros servicios (shopping stop, car seat, booster seat)
- Tipo de vehiculo y numero de pasajeros
- Destination (hotel)
- Fecha y hora de llegada
- Si es Round Trip: fecha de regreso, lugar de recogida, numero de vuelo, empresa aerea, hora de vuelo, hora sugerida de recogida
- Instrucciones para localizar el vehiculo

## Tareas

### 1. Base de Datos
- [x] Nueva tabla `client_email_settings` en `db/schema.ts`
- [x] Actualizar relaciones en `db/relations.ts`
- [x] Drizzle migration

### 2. Backend — Nuevos Routers
- [x] `api/email-settings-router.ts` — CRUD configuracion de email
- [x] `api/email-router.ts` — Envio de emails con nodemailer + PDF
- [x] Actualizar `api/router.ts` para registrar los nuevos routers
- [x] Integrar envio de email en `api/widget-router.ts` (createBooking)

### 3. Frontend — Panel Admin
- [x] Nuevo componente `src/components/admin/AdminEmailSettings.tsx`
- [x] Agregar tab "Email" en `src/sections/AdminPanel.tsx`
- [x] Actualizar traducciones i18n (EN, ES, PT)

### 4. Dependencias
- [x] `nodemailer` — Envio de emails via SMTP
- [x] `pdfmake` — Generacion de PDFs
- [x] `@types/nodemailer` — Tipos

### 5. Variables de Entorno
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

## Stack de Email
- **Envio**: Nodemailer con SMTP (compatible con cualquier proveedor: Gmail, SendGrid, AWS SES, etc.)
- **PDF**: PDFMake con formato profesional
