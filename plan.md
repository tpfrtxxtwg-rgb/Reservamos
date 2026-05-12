# Plan de Trabajo — ReserVamos

## Estado Actual del Proyecto
- Landing page completa (Hero, Features, Pricing, Integration CTA, Footer)
- Sistema de autenticacion (Login, Register, JWT)
- Panel de Admin con 12+ modulos (Dashboard, Bookings, Zones, Destinations, Vehicles, Services, Pricing, Optional Services, Drivers, Calendar, Reports, Settings)
- Widget de reservas interactivo con preview
- Backend: Hono + tRPC + Drizzle ORM + MySQL
- i18n: EN, ES, PT
- AWS S3 para archivos
- Deploy en Railway

## Areas de Trabajo Identificadas

### Fase 1 — Pulir Landing Page (Impacto Visual + Conversion)
- [ ] Corregir LanguageSwitcher (eliminar `zh` fantasma o agregar traduccion zh)
- [ ] Agregar seccion de Testimonios/Clientes (social proof)
- [ ] Agregar logos de operadores que usan la plataforma
- [ ] Agregar seccion de FAQ
- [ ] Animaciones de entrada (Framer Motion ya esta instalado)

### Fase 2 — Mejoras en Widget de Reservas
- [ ] Verificar flujo completo del widget (5 steps segun health check)
- [ ] Mejorar UX de fechas/calendario
- [ ] Validaciones de formulario (Zod ya esta instalado)
- [ ] Responsive del widget

### Fase 3 — Panel de Admin
- [ ] Verificar renderizado de todas las tabs
- [ ] Mejorar dashboard con charts reales (Recharts ya esta instalado)
- [ ] Funcionalidad de calendario
- [ ] Reportes con filtros

### Fase 4 — Backend/API
- [ ] Webhooks para notificaciones (WhatsApp, email)
- [ ] Sistema de pagos (Stripe, PayPal, MercadoPago)
- [ ] API publica para el widget embeddable

### Fase 5 — Deploy y Produccion
- [ ] Variables de entorno en Railway
- [ ] SSL/HTTPS
- [ ] Monitoring y logs
