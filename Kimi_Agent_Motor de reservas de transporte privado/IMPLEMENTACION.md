# ReserVamos - Guía de Implementación Paso a Paso

## Índice
1. [Preparación del Entorno](#1-preparación-del-entorno)
2. [Configuración de la Base de Datos](#2-configuración-de-la-base-de-datos)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [Despliegue del Backend](#4-despliegue-del-backend)
5. [Despliegue del Frontend](#5-despliegue-del-frontend)
6. [Configuración del Widget Embebible](#6-configuración-del-widget-embebible)
7. [Primer Cliente (Onboarding)](#7-primer-cliente-onboarding)
8. [Monitoreo y Mantenimiento](#8-monitoreo-y-mantenimiento)
9. [Escalabilidad Futura](#9-escalabilidad-futura)

---

## 1. Preparación del Entorno

### Requisitos Previos
- Node.js 20+ (verificar con `node -v`)
- Git
- Cuenta en proveedor cloud (Vercel, Railway, o similar)
- Cuenta en TiDB Cloud (base de datos MySQL)
- Dominio propio (ej: `reservamos.app`)

### 1.1 Clonar el Proyecto
```bash
git clone <tu-repo> reservamos
cd reservamos
npm install
```

### 1.2 Verificar Build Local
```bash
npm run check    # TypeScript check
npm run build    # Build completo
```

---

## 2. Configuración de la Base de Datos

### 2.1 Crear Base de Datos en TiDB Cloud (Gratuito)
1. Ir a https://tidbcloud.com
2. Crear cuenta / iniciar sesión
3. Crear nuevo cluster (Developer Tier = gratis)
4. Seleccionar región más cercana (us-east-1 recomendado)
5. Esperar ~5 minutos a que el cluster esté activo

### 2.2 Obtener DATABASE_URL
1. En TiDB Cloud → Cluster → Connect
2. Seleccionar "General" como tipo de conexión
3. Elegir "Node.js" como framework
4. Copiar la connection string

Ejemplo:
```
mysql://user:password@host:4000/database?ssl={"rejectUnauthorized":true}
```

### 2.3 Configurar en el Proyecto
```bash
# Editar .env
DATABASE_URL=mysql://TU_USUARIO:TU_PASSWORD@TU_HOST:4000/TU_DB?ssl={"rejectUnauthorized":true}
```

### 2.4 Crear Tablas (Schema)
```bash
npm run db:push
```

### 2.5 Sembrar Datos Iniciales
```bash
npx tsx db/seed.ts
```

Verificar que se creó el cliente demo:
- Cliente: "Transportes Riviera Maya"
- API Key: `rv_demo_client_12345`

---

## 3. Variables de Entorno

### 3.1 Archivo .env (Desarrollo)
```bash
# Base de Datos
DATABASE_URL=mysql://...

# OAuth (Kimi Platform)
VITE_APP_ID=tu-app-id
VITE_KIMI_AUTH_URL=https://kimi-auth-url
APP_SECRET=tu-app-secret
OWNER_UNION_ID=tu-union-id

# Server
PORT=3000
```

### 3.2 Variables para Producción
Crear archivo `.env.production.local` (NO commitear):
```bash
# Base de datos de producción
DATABASE_URL=mysql://PROD_USER:PROD_PASS@PROD_HOST:4000/reservamos_prod

# OAuth de producción
VITE_APP_ID=prod-app-id
VITE_KIMI_AUTH_URL=https://prod-auth-url
APP_SECRET=prod-secret
OWNER_UNION_ID=owner-id
```

---

## 4. Despliegue del Backend + Frontend (Fullstack)

### Opción A: Railway (Recomendado)

#### 4.1.1 Crear Proyecto en Railway
1. Ir a https://railway.app
2. Crear nuevo proyecto desde GitHub
3. Conectar repo de ReserVamos

#### 4.1.2 Configurar Variables de Entorno
En Railway Dashboard → Variables:
```
DATABASE_URL=mysql://...
VITE_APP_ID=...
VITE_KIMI_AUTH_URL=...
APP_SECRET=...
OWNER_UNION_ID=...
NODE_ENV=production
```

#### 4.1.3 Configurar Build
Railway detectará automáticamente el `Dockerfile` o usará:
- Build Command: `npm run build`
- Start Command: `npm start`

#### 4.1.4 Verificar Deploy
Railway asignará URL automática:
```
https://reservamos.up.railway.app
```

Probar endpoints:
```bash
curl https://reservamos.up.railway.app/api/trpc/ping
# Debe retornar: {"ok":true}
```

### Opción B: Vercel (Frontend) + Railway (Backend)

#### 4.2.1 Deploy Frontend en Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Configurar en Vercel:
- Framework: Vite
- Build: `npm run build`
- Output: `dist/public`

#### 4.2.2 Deploy Backend en Railway
Seguir pasos de Opción A pero solo backend.

Configurar CORS en backend para permitir frontend de Vercel.

---

## 5. Configurar Dominio Personalizado

### 5.1 Comprar Dominio
- Namecheap, Cloudflare Registrar, o tu proveedor preferido
- Ejemplo: `reservamos.app`

### 5.2 Configurar DNS
```
Type: A
Name: @
Value: IP_DE_TU_SERVIDOR
TTL: Auto
```

Para subdominios:
```
Type: CNAME
Name: api
Value: tu-app.up.railway.app
```

### 5.3 SSL/HTTPS
Railway y Vercel proporcionan SSL automático con Let's Encrypt.

---

## 6. Configuración del Widget Embebible

### 6.1 Generar Script de Embed
El widget se sirve desde la ruta principal del sitio. Para integrar en un sitio de un cliente:

```html
<!-- Widget ReserVamos -->
<div id="reservamos-widget"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://reservamos.app/widget.js';
    script.setAttribute('data-client-id', 'rv_demo_client_12345');
    script.setAttribute('data-theme', 'light');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
```

### 6.2 CORS para Widget
El backend ya tiene CORS configurado. Verificar que el dominio del cliente esté permitido.

En producción, agregar validación de dominio por cliente:
```typescript
// api/widget-router.ts
if (client.domain && client.domain !== origin) {
  throw new Error("Domain not authorized");
}
```

---

## 7. Primer Cliente (Onboarding)

### 7.1 Registrar Nuevo Cliente
Usar el panel de admin (`/admin`) o llamar a la API:

```bash
curl -X POST https://reservamos.app/api/trpc/tenant.create \
  -H 'Content-Type: application/json' \
  -d '{
    "json": {
      "name": "Transportes Cancun",
      "email": "admin@transportescancun.com",
      "domain": "transportescancun.com",
      "plan": "starter"
    }
  }'
```

### 7.2 Obtener API Key
La respuesta incluirá el `apiKey` único para ese cliente.

### 7.3 Configurar Servicios del Cliente
```bash
curl -X POST https://reservamos.app/api/trpc/service.create \
  -H 'Content-Type: application/json' \
  -d '{
    "json": {
      "clientId": 2,
      "name": "Aeropuerto -> Hotel",
      "slug": "airport-to-hotel",
      "basePrice": "60.00"
    }
  }'
```

### 7.4 Configurar Vehículos del Cliente
```bash
curl -X POST https://reservamos.app/api/trpc/vehicle.create \
  -H 'Content-Type: application/json' \
  -d '{
    "json": {
      "clientId": 2,
      "name": "Suburban",
      "capacityMin": 1,
      "capacityMax": 6,
      "basePrice": "120.00",
      "features": ["WiFi", "A/C"]
    }
  }'
```

### 7.5 Dar al Cliente su Código de Embed
```html
<script src="https://reservamos.app/widget.js" 
  data-client-id="rv_nuevo_cliente_abc123" 
  data-theme="light">
</script>
```

---

## 8. Monitoreo y Mantenimiento

### 8.1 Logs
```bash
# Railway
railway logs

# O ver en dashboard de Railway → Logs
```

### 8.2 Métricas Clave
| Métrica | Herramienta |
|---------|-------------|
| Uptime | Railway Dashboard |
| Requests | Vercel Analytics |
| Errores | Sentry (recomendado) |
| DB Performance | TiDB Cloud Dashboard |

### 8.3 Backups de Base de Datos
TiDB Cloud incluye backups automáticos diarios.
Para backup manual:
```bash
mysqldump -h HOST -u USER -p DATABASE > backup_$(date +%Y%m%d).sql
```

### 8.4 Actualizaciones
```bash
# Actualizar dependencias
npm update

# Verificar compatibilidad
npm run check
npm run build

# Deploy
railway up
```

---

## 9. Escalabilidad Futura

### 9.1 Cuando crezcas a +100 clientes
- Migrar a TiDB Cloud Serverless Tier ($0.01/hora)
- Implementar Redis para cache (Upstash)
- Agregar CDN para imágenes (Cloudflare R2)

### 9.2 Cuando necesites múltiples workers
- Separar frontend y backend en servicios distintos
- Agregar cola de procesamiento (Inngest / BullMQ)
- Implementar webhook para notificaciones

### 9.3 Roadmap Técnico
| Fase | Cuándo | Qué hacer |
|------|--------|-----------|
| MVP | Ahora | Lo que tienes |
| Beta | 5-10 clientes | Stripe Connect, Emails |
| Scale | 50+ clientes | Redis, CDN, Webhooks |
| Enterprise | 200+ clientes | Multi-region, SLA |

---

## Checklist de Lanzamiento

- [ ] Base de datos creada y migrada
- [ ] Variables de entorno configuradas
- [ ] Build exitoso localmente
- [ ] Deploy en Railway/Vercel exitoso
- [ ] Endpoint `/api/trpc/ping` responde OK
- [ ] Widget crea reservas correctamente
- [ ] Panel admin muestra datos reales
- [ ] Dominio personalizado configurado
- [ ] SSL/HTTPS funcionando
- [ ] Primer cliente demo creado
- [ ] Primer reserva de prueba exitosa
- [ ] Logs y monitoreo activos

---

## Soporte y Troubleshooting

### Problema: "Database connection refused"
**Solución**: Verificar `DATABASE_URL` y que el cluster TiDB esté activo.

### Problema: "CORS error"
**Solución**: El backend permite CORS automáticamente. Verificar que el origen del widget coincida con el dominio registrado del cliente.

### Problema: "Widget no se carga"
**Solución**: Verificar que `data-client-id` sea válido y el cliente esté `active`.

### Problema: "OAuth no funciona"
**Solución**: Verificar `VITE_APP_ID`, `APP_SECRET`, y que el callback URL en el portal coincida con tu dominio + `/api/oauth/callback`.

---

**¡ReserVamos está listo para conquistar el mercado de transportación turística! 🚗🌴**
