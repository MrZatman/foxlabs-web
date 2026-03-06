# FoxLabs Web

Sitio web publico de FoxLabs - Landing page, cotizador y portal de clientes.

## Stack Tecnologico

- **Framework**: Next.js 15 (App Router)
- **React**: 19.x
- **TypeScript**: Strict mode
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (compartido con foxorchestrator)
- **Auth**: Supabase SSR (@supabase/ssr)
- **Notifications**: Telegram Bot API
- **Deploy**: Vercel

## Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx                    # Landing page publica
│   ├── layout.tsx                  # Root layout con fonts
│   ├── cotizar/
│   │   └── page.tsx                # Wizard de cotizacion (5 pasos)
│   ├── portal/
│   │   ├── login/page.tsx          # Login de clientes
│   │   ├── dashboard/page.tsx      # Dashboard del cliente
│   │   └── requests/
│   │       ├── new/page.tsx        # Crear nuevo request
│   │       └── [id]/page.tsx       # Detalle de request
│   └── api/
│       ├── leads/route.ts          # POST - Guardar leads del cotizador
│       ├── auth/
│       │   └── logout/route.ts     # POST - Cerrar sesion
│       ├── portal/
│       │   └── requests/route.ts   # POST - Crear requests
│       └── telegram/
│           └── webhook/route.ts    # Webhook bot publico
├── components/
│   └── ui/                         # shadcn/ui components
├── lib/
│   └── supabase/
│       ├── client.ts               # Supabase browser client
│       ├── server.ts               # Supabase server client
│       └── middleware.ts           # Auth middleware helper
└── middleware.ts                   # Protege /portal/*
```

## Flujo de la Aplicacion

### 1. Landing Page (`/`)
- Hero section con CTA
- Stats animadas
- Servicios ofrecidos
- Proceso de trabajo
- Portfolio con proyectos
- Testimonios
- Footer con contacto

### 2. Cotizador (`/cotizar`)
Wizard de 5 pasos:
1. **Tipo de proyecto**: App Web, E-commerce, Landing, Dashboard, API
2. **Features**: Auth, Pagos, CMS, Analytics, Integraciones, etc.
3. **Descripcion**: Texto libre de la idea
4. **Presupuesto y timeline**: Rangos predefinidos
5. **Contacto**: Nombre, email, telefono, empresa

Al enviar:
- Guarda lead en Supabase (`leads` table)
- Notifica al admin via Telegram (@FoxOrchestrator_bot)
- Muestra confirmacion al usuario

### 3. Portal de Clientes (`/portal/*`)
Requiere autenticacion (middleware protege estas rutas).

**Login** (`/portal/login`):
- Email + password
- Supabase Auth

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
- Detalles del request

## Tablas de Supabase

### leads
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_number SERIAL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  project_type TEXT,
  features TEXT[],
  description TEXT,
  budget TEXT,
  timeline TEXT,
  source TEXT DEFAULT 'web',
  source_details TEXT,
  telegram_chat_id BIGINT,
  telegram_username TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### clients
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  contact_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  name TEXT NOT NULL,
  production_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### requests
```sql
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number SERIAL,
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  source TEXT DEFAULT 'portal',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Telegram Bots

### Bot Publico: @FoxLabsDev_bot
- **Token**: `TELEGRAM_FOXLABS_BOT_TOKEN`
- **Webhook**: `/api/telegram/webhook`
- **Funcion**: Recibe mensajes de leads potenciales
- **Comportamiento**:
  - Guarda/actualiza lead en Supabase
  - Envia auto-reply al usuario
  - Forwardea mensaje al admin bot

### Bot Admin: @FoxOrchestrator_bot
- **Token**: `TELEGRAM_ADMIN_BOT_TOKEN`
- **Chat ID**: `TELEGRAM_ADMIN_CHAT_ID`
- **Funcion**: Notifica al admin sobre:
  - Nuevos leads del cotizador
  - Nuevos requests del portal
  - Mensajes del bot publico

## Variables de Entorno

```env
# Supabase (compartido con foxorchestrator)
NEXT_PUBLIC_SUPABASE_URL=https://rjhnwqqooshosylsoqmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Telegram Bot Publico
TELEGRAM_FOXLABS_BOT_TOKEN=8634069503:AAG...

# Telegram Bot Admin
TELEGRAM_ADMIN_BOT_TOKEN=8435361885:AAG...
TELEGRAM_ADMIN_CHAT_ID=8302303906

# Site URL
NEXT_PUBLIC_SITE_URL=https://foxlabs.vercel.app
```

## Middleware de Autenticacion

El middleware (`src/middleware.ts`) protege todas las rutas `/portal/*`:

```typescript
export const config = {
  matcher: ['/portal/:path*']
}
```

Usa `@supabase/ssr` para manejar cookies de sesion correctamente en server components.

## Deploy en Vercel

1. Importar repo `MrZatman/foxlabs-web`
2. Agregar variables de entorno del `.env.local`
3. Deploy
4. Configurar webhook de Telegram:
   ```
   https://api.telegram.org/bot{TELEGRAM_FOXLABS_BOT_TOKEN}/setWebhook?url=https://foxlabs.vercel.app/api/telegram/webhook
   ```

## Relacion con FoxOrchestrator

- **Misma base de datos Supabase**: Comparten proyecto `rjhnwqqooshosylsoqmu`
- **Mismo bot admin**: @FoxOrchestrator_bot recibe notificaciones de ambos
- **Flujo completo**:
  1. Lead llega via cotizador o Telegram
  2. Admin recibe notificacion
  3. Admin convierte lead a cliente en foxorchestrator
  4. Cliente accede al portal con sus credenciales
  5. Cliente crea requests
  6. FoxOrchestrator ejecuta los requests con Claude Code

## Scripts

```bash
pnpm dev      # http://localhost:3000
pnpm build    # Build produccion
pnpm start    # Servidor produccion
pnpm lint     # ESLint
```

## Paginas

| Ruta | Tipo | Descripcion |
|------|------|-------------|
| `/` | Publica | Landing page |
| `/cotizar` | Publica | Wizard de cotizacion |
| `/portal/login` | Publica | Login clientes |
| `/portal/dashboard` | Protegida | Dashboard cliente |
| `/portal/requests/new` | Protegida | Crear request |
| `/portal/requests/[id]` | Protegida | Ver request |

## API Routes

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/leads` | Guardar lead del cotizador |
| POST | `/api/auth/logout` | Cerrar sesion |
| POST | `/api/portal/requests` | Crear request |
| GET/POST | `/api/telegram/webhook` | Webhook bot publico |

---

## Estado del Proyecto (Marzo 2026)

- Landing page completa
- Cotizador de 5 pasos funcionando
- Portal de clientes con auth
- Dashboard con stats y proyectos
- Sistema de requests
- Notificaciones Telegram
- Listo para deploy en Vercel

## Proximos Pasos

1. Deploy a Vercel
2. Configurar webhook de Telegram
3. Crear primer cliente de prueba en Supabase
4. Probar flujo completo
