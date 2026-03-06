# FoxLabs Web

Sitio web de FoxLabs - Landing, cotizador, portal clientes y admin dashboard.

**URL Produccion**: https://foxlabs.vercel.app

## Sistema Dual

Este repo es el **frontend** del sistema FoxLabs. Trabaja en conjunto con **foxorchestrator**:

| Componente | Repo | Responsabilidad |
|------------|------|-----------------|
| **Este repo** | foxlabs-web | UI: Landing, Portal clientes, Admin |
| **Backend** | foxorchestrator | Electron: Claude Code, Telegram, Deploy |

**Ambos comparten la misma base de datos Supabase.**

Cuando un cliente crea un request en el portal:
1. Se guarda en Supabase
2. foxorchestrator detecta via Realtime
3. Claude Code ejecuta las tareas
4. Vercel despliega automaticamente
5. DeployWatcher (en foxorchestrator) detecta y actualiza status

## Stack

- **Framework**: Next.js 15 (App Router)
- **React**: 19.x
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (compartido con foxorchestrator)
- **Auth**: Supabase SSR
- **Deploy**: Vercel (activo)

## Estructura

```
src/app/
├── page.tsx                    # Landing publica
├── cotizar/page.tsx            # Wizard 5 pasos
├── portal/                     # Portal clientes
│   ├── login/
│   ├── dashboard/
│   └── requests/[new|id]/
├── admin/                      # Dashboard admin
│   ├── (auth)/login/
│   └── (dashboard)/
│       ├── page.tsx            # Dashboard
│       ├── leads/[id]/
│       ├── clients/[new|id]/
│       ├── projects/[new|slug]/
│       ├── requests/[id|queue]/
│       ├── chrome/[new|id]/
│       ├── supabase/[id]/
│       ├── activity/
│       ├── metrics/
│       └── settings/
└── api/
    ├── leads/
    ├── auth/logout/
    ├── portal/requests/
    └── telegram/webhook/
```

## Rutas Principales

| Area | Rutas | Descripcion |
|------|-------|-------------|
| Publico | `/`, `/cotizar` | Landing + Cotizador |
| Portal | `/portal/*` | Clientes autenticados |
| Admin | `/admin/*` | Dashboard administrativo |

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://rjhnwqqooshosylsoqmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_FOXLABS_BOT_TOKEN=     # @FoxLabsDev_bot
TELEGRAM_ADMIN_BOT_TOKEN=       # @FoxOrchestrator_bot
TELEGRAM_ADMIN_CHAT_ID=8302303906
NEXT_PUBLIC_SITE_URL=https://foxlabs.vercel.app
```

## Scripts

```bash
pnpm dev      # localhost:3000
pnpm build    # Build produccion
pnpm lint     # ESLint
```

## Status de Requests

El portal muestra estos estados a los clientes:

| Status | UI Label | Descripcion |
|--------|----------|-------------|
| inbox | Recibido | Request nuevo |
| planning | Planificando | Claude genera plan |
| approved | Aprobado | Admin aprobo |
| in_progress | En Progreso | Claude ejecutando |
| **deploying** | Publicando... | Esperando Vercel (animado) |
| completed | Completado | Deploy terminado |

**Importante**: El status `deploying` evita confusion del cliente. Claude termina → push → Vercel tarda 1-2 min → DeployWatcher detecta → completed.

## Referencias

- @.claude/rules/database.md - Schema SQL
- @.claude/rules/telegram.md - Configuracion bots
- @.claude/rules/flows.md - Flujos cotizador/portal
- @docs/HISTORY.md - Historial y notas
