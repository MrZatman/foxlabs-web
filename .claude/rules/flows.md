---
paths:
  - "src/app/cotizar/**"
  - "src/app/portal/**"
---

# Flujos de la Aplicacion

## Landing Page (`/`)
- Hero section con CTA
- Stats animadas
- Servicios ofrecidos
- Proceso de trabajo
- Portfolio con proyectos
- Testimonios
- Footer con contacto

## Cotizador (`/cotizar`)
Wizard de 5 pasos:
1. **Tipo de proyecto**: App Web, E-commerce, Landing, Dashboard, API
2. **Features**: Auth, Pagos, CMS, Analytics, Integraciones
3. **Descripcion**: Texto libre de la idea
4. **Presupuesto y timeline**: Rangos predefinidos
5. **Contacto**: Nombre, email, telefono, empresa

Al enviar:
- Guarda lead en Supabase (`leads` table)
- Notifica al admin via Telegram
- Muestra confirmacion al usuario

## Portal de Clientes (`/portal/*`)
Requiere autenticacion (middleware protege estas rutas).

**Login** (`/portal/login`):
- Email + password via Supabase Auth

**Dashboard** (`/portal/dashboard`):
- Stats: pendientes, en progreso, completados
- Lista de proyectos del cliente
- Requests recientes
- Boton "Nuevo Request"

**Nuevo Request** (`/portal/requests/new`):
- Seleccionar proyecto
- Tipo: feature, bug, change, support
- Prioridad: low, medium, high, urgent
- Titulo y descripcion

**Detalle Request** (`/portal/requests/[id]`):
- Timeline con eventos
- Barra de progreso
- Estado actual

## Middleware Auth

Protege `/portal/*` usando `@supabase/ssr`:

```typescript
export const config = {
  matcher: ['/portal/:path*']
}
```
