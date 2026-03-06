# FoxLabs Web

Landing, cotizador, portal clientes y admin dashboard.

**URL**: https://foxlabs.vercel.app

## Sistema Dual

| Proyecto | Donde corre | Deploy |
|----------|-------------|--------|
| **foxlabs-web** (este) | Vercel | SI - push a GitHub |
| **foxorchestrator** | PC local (Electron) | NO - nunca se sube |

Ambos comparten Supabase.

| Componente | Repo | Responsabilidad |
|------------|------|-----------------|
| **Este repo** | foxlabs-web | UI publica y admin |
| **Backend** | foxorchestrator | Claude Code, Telegram (LOCAL) |

## Stack

- **Framework**: Next.js 15 (App Router)
- **React**: 19.x
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (compartido)
- **Auth**: Supabase SSR
- **Deploy**: Vercel

## Inicio Rapido

```bash
pnpm dev      # localhost:3000
pnpm build    # Verifica build
```

## Variables Criticas

```env
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_FOXLABS_BOT_TOKEN=     # @FoxLabsDev_bot
TELEGRAM_ADMIN_BOT_TOKEN=       # @FoxOrchestrator_bot
TELEGRAM_ADMIN_CHAT_ID=8302303906
```

## Rutas

| Area | Rutas | Descripcion |
|------|-------|-------------|
| Publico | `/`, `/cotizar` | Landing + Cotizador |
| Portal | `/portal/*` | Clientes autenticados |
| Admin | `/admin/*` | Dashboard administrativo |

## Status de Requests

Estados que ve el cliente en el portal:

| Status | Label | Animado? |
|--------|-------|----------|
| inbox | Recibido | No |
| planning | Planificando | No |
| approved | Aprobado | No |
| in_progress | En Progreso | No |
| **deploying** | Publicando... | SI (pulse) |
| completed | Completado | No |

**Importante**: `deploying` existe porque Vercel tarda 1-2 min despues del push.

## TypeScript

Patron para Supabase joins:

```typescript
// MAL - error de tipos
const name = request.projects.clients.email

// BIEN - cast explicito
const name = (request.projects as unknown as { clients: { email: string } })?.clients?.email
```

## Referencias

- @.claude/rules/database.md - Schema SQL
- @.claude/rules/flows.md - Flujos cotizador/portal
- @.claude/rules/telegram.md - Bots config
- @.claude/rules/status-flow.md - Estados de requests
