# Supabase Server

Cliente de Supabase para Server Components, Server Actions, y API Routes.

## Crear Cliente

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  )
}
```

## Uso en Server Component

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()

  // Query simple
  const { data, error } = await supabase
    .from('clients')
    .select('*')

  // Con count
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })

  // Con relaciones
  const { data: requests } = await supabase
    .from('requests')
    .select(`
      id, title, status,
      projects(name, client_id)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return <div>{/* ... */}</div>
}
```

## Uso en API Route

```typescript
// src/app/api/example/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Verificar auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from('requests')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

## Queries Comunes

```typescript
// Select con filtros
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('status', 'new')
  .gte('created_at', sevenDaysAgo.toISOString())
  .order('created_at', { ascending: false })

// Insert con return
const { data, error } = await supabase
  .from('requests')
  .insert({ title, description })
  .select('request_number')
  .single()

// Update
await supabase
  .from('requests')
  .update({ status: 'completed' })
  .eq('id', requestId)

// In filter
const { data } = await supabase
  .from('requests')
  .select('*')
  .in('project_id', projectIds)

// Is null
const { data } = await supabase
  .from('questions')
  .select('*')
  .is('answer', null)
```

## DO

- Siempre `await createClient()` (es async en Next 15)
- Verificar `error` despues de operaciones
- Usar `.single()` cuando esperas un resultado
- Usar `!inner` para joins obligatorios

## DON'T

- NO usar este cliente en Client Components
- NO olvidar await en cookies()
- NO ignorar errores de Supabase
