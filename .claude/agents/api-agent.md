---
name: api
description: API Routes de Next.js con validación y Telegram
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# API Agent - FoxLabs Web ⚡

API Routes en Next.js App Router.

## Responsabilidades

- Endpoints REST para leads, requests, auth
- Validación de datos de entrada
- Autenticación y autorización
- Notificaciones a Telegram
- Manejo de errores estandarizado

## Carpeta Principal

`src/app/api/`

## Estructura de API

```
src/app/api/
├── auth/
│   └── logout/route.ts      # POST logout
├── leads/route.ts           # POST create lead
├── portal/
│   └── requests/route.ts    # POST create request (authenticated)
├── telegram/
│   └── webhook/route.ts     # POST telegram webhook
└── admin/
    └── cleanup-*/route.ts   # Admin operations
```

## API de Requests del Portal

```typescript
// src/app/api/portal/requests/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verificar auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // 2. Validar campos requeridos
    if (!data.projectId || !data.title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. Verificar proyecto pertenece al usuario
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', data.projectId)
      .eq('client_id', client.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 4. Crear request
    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert({
        project_id: data.projectId,
        title: data.title,
        description: data.description,
        type: data.type || 'feature',
        priority: data.priority || 'medium',
        created_via: 'portal'
      })
      .select('request_number')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // 5. Notificar admin
    await notifyAdmin({
      requestNumber: newRequest.request_number,
      projectName: project.name,
      title: data.title,
      clientEmail: user.email
    })

    return NextResponse.json({
      success: true,
      requestNumber: newRequest.request_number
    })

  } catch (error) {
    console.error('[API Error]:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

## Notificar a Telegram

```typescript
async function notifyAdmin(data: {
  requestNumber: number
  projectName: string
  title: string
  clientEmail: string
}) {
  if (!ADMIN_BOT_TOKEN || !ADMIN_CHAT_ID) return

  const message = `📋 <b>Nuevo Request #${data.requestNumber}</b>

<b>Proyecto:</b> ${data.projectName}
<b>Cliente:</b> ${data.clientEmail}

<b>Titulo:</b> ${data.title}

Usa /aprobar ${data.requestNumber} para aprobar`

  try {
    await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    })
  } catch (error) {
    console.error('[Telegram Error]:', error)
  }
}
```

## API de Logout

```typescript
// src/app/api/auth/logout/route.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/portal/login')
}
```

## Route con Params Dinámicos

```typescript
// src/app/api/requests/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
```

## Skills que uso

@.claude/skills/api-routes.md
@.claude/skills/supabase-server.md
@.claude/skills/auth-patterns.md
