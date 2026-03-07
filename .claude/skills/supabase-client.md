# Supabase Client

Cliente de Supabase para Client Components (browser).

## Crear Cliente

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Uso Basico

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ClientList() {
  const [clients, setClients] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setClients(data)
    }
    loadData()
  }, [])

  return (
    <div>
      {clients.map(client => (
        <div key={client.id}>{client.name}</div>
      ))}
    </div>
  )
}
```

## Realtime Subscription

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LiveEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Cargar datos iniciales
    loadEvents()

    // Suscribirse a cambios
    const channel = supabase
      .channel('events_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'execution_events' },
        (payload) => {
          setEvents(prev => [payload.new as Event, ...prev].slice(0, 100))
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadEvents() {
    const { data } = await supabase
      .from('execution_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) setEvents(data)
  }

  return (
    <div>
      {events.map(event => (
        <div key={event.id}>{event.message}</div>
      ))}
    </div>
  )
}
```

## Auth en Cliente

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const email = form.email.value
    const password = form.password.value

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    window.location.href = '/portal/dashboard'
  }

  return (
    <form onSubmit={handleLogin}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  )
}
```

## Mutaciones

```tsx
async function updateStatus(requestId: string, status: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('requests')
    .update({ status })
    .eq('id', requestId)

  if (error) {
    console.error('Update failed:', error)
    return false
  }

  return true
}
```

## DO

- Crear cliente dentro del componente o efecto
- Siempre limpiar subscriptions en useEffect return
- Usar `'use client'` al inicio del archivo
- Usar `.slice(0, N)` para limitar items en realtime

## DON'T

- NO usar este cliente en Server Components
- NO olvidar cleanup de channels
- NO crear cliente fuera del componente (SSR issues)
- NO suscribirse a tablas muy activas sin filtros
