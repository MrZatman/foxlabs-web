# API Routes

API routes en Next.js 15 App Router.

## Estructura Basica

```typescript
// src/app/api/example/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('items')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

## Con Autenticacion

```typescript
// src/app/api/portal/requests/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verificar auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validar
    if (!data.projectId || !data.title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificar que el proyecto pertenece al usuario
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

    // Crear request
    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert({
        project_id: data.projectId,
        title: data.title,
        description: data.description,
        type: data.type || 'feature',
        priority: data.priority || 'medium'
      })
      .select('request_number')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

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

## Notificar por Telegram

```typescript
async function notifyAdmin(data: { title: string; requestNumber: number }) {
  const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN
  const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!ADMIN_BOT_TOKEN || !ADMIN_CHAT_ID) return

  const message = `<b>Nuevo Request #${data.requestNumber}</b>\n${data.title}`

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

## Route con Dynamic Params

```typescript
// src/app/api/requests/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

## DO

- Siempre verificar auth para endpoints protegidos
- Validar input antes de usar
- Usar try/catch para manejo de errores
- Retornar status codes apropiados
- Loggear errores con contexto

## DON'T

- NO confiar en datos del cliente sin validar
- NO exponer errores internos al cliente
- NO olvidar verificar ownership de recursos
- NO hardcodear credenciales
