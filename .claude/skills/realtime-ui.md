# Realtime UI

Componentes con datos en tiempo real usando Supabase Realtime.

## Pattern Basico

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Event {
  id: string
  event_type: string
  message: string
  status: 'success' | 'failed' | 'warning' | 'info'
  created_at: string
}

export function RealtimeEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 1. Cargar datos iniciales
    loadEvents()

    // 2. Suscribirse a nuevos eventos
    const channel = supabase
      .channel('events_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'execution_events' },
        (payload) => {
          const newEvent = payload.new as Event
          setEvents(prev => [newEvent, ...prev].slice(0, 100))
        }
      )
      .subscribe()

    // 3. Cleanup al desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadEvents() {
    setLoading(true)
    const { data } = await supabase
      .from('execution_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) setEvents(data)
    setLoading(false)
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      {events.map(event => (
        <EventItem key={event.id} event={event} />
      ))}
    </div>
  )
}
```

## Con Contadores

```tsx
const [eventCounts, setEventCounts] = useState({
  success: 0, failed: 0, warning: 0, info: 0
})

// En el subscription callback
.on('postgres_changes', { event: 'INSERT', ... }, (payload) => {
  const newEvent = payload.new as Event
  setEvents(prev => [newEvent, ...prev].slice(0, 100))

  // Actualizar contador
  setEventCounts(prev => ({
    ...prev,
    [newEvent.status]: prev[newEvent.status as keyof typeof prev] + 1
  }))
})
```

## Con Filtro de Status

```tsx
const [statusFilter, setStatusFilter] = useState<string | null>(null)

// Cards clickeables para filtrar
<Card
  className={`cursor-pointer ${statusFilter === 'failed' ? 'ring-2 ring-red-500' : ''}`}
  onClick={() => setStatusFilter(statusFilter === 'failed' ? null : 'failed')}
>
  <CardContent>
    <p>{eventCounts.failed} Errores</p>
  </CardContent>
</Card>

// Filtrar eventos
const filteredEvents = statusFilter
  ? events.filter(e => e.status === statusFilter)
  : events
```

## Timeline con Iconos Dinamicos

```tsx
const eventIcons: Record<string, React.ElementType> = {
  execution_started: Play,
  execution_completed: CheckCircle,
  execution_failed: XCircle,
  task_started: Play,
  task_completed: CheckCircle,
  git_commit: GitCommit,
  git_push: GitCommit,
  vercel_building: Rocket,
  vercel_ready: Rocket
}

const statusColors: Record<string, string> = {
  success: 'text-green-400',
  failed: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400'
}

function EventItem({ event }: { event: Event }) {
  const Icon = eventIcons[event.event_type] || Activity
  const colorClass = statusColors[event.status]

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
      <div className={colorClass}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <span className="text-xs text-muted-foreground">
          {new Date(event.created_at).toLocaleTimeString()}
        </span>
        <p className="text-sm">{event.message}</p>
      </div>
    </div>
  )
}
```

## Auto-Refresh Manual

```tsx
export function SystemHealth({ autoRefresh, refreshIntervalMs }: {
  autoRefresh?: boolean
  refreshIntervalMs?: number
}) {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    loadStatus()

    if (autoRefresh && refreshIntervalMs) {
      const interval = setInterval(loadStatus, refreshIntervalMs)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshIntervalMs])

  async function loadStatus() {
    // fetch...
  }

  return <div>{/* status */}</div>
}

// Uso
<SystemHealth autoRefresh={true} refreshIntervalMs={30000} />
```

## DO

- Siempre limpiar subscriptions en return de useEffect
- Usar `.slice(0, N)` para limitar items
- Crear cliente dentro del componente
- Cargar datos iniciales antes de suscribirse
- Usar `'use client'` al inicio

## DON'T

- NO suscribirse sin cleanup
- NO acumular eventos infinitamente
- NO usar realtime para tablas muy activas sin filtros
- NO olvidar estado de loading
