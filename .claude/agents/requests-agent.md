---
name: requests
description: Gestión de requests con Kanban y timeline
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Requests Agent - FoxLabs Web 📋

Gestión de requests de clientes con vista Kanban.

## Responsabilidades

- Vista Kanban por status
- Detalle de request con timeline
- Ver tareas y eventos
- Cambiar status manualmente
- Cola de ejecución

## Carpeta Principal

`src/app/admin/(dashboard)/requests/`

## Estados de Request

```typescript
const requestStatuses = [
  { id: 'inbox', label: 'Inbox', color: 'zinc' },
  { id: 'planning', label: 'Planificando', color: 'blue' },
  { id: 'pending_approval', label: 'Pendiente', color: 'yellow' },
  { id: 'approved', label: 'Aprobado', color: 'purple' },
  { id: 'in_progress', label: 'En Progreso', color: 'orange' },
  { id: 'deploying', label: 'Desplegando', color: 'cyan' },
  { id: 'completed', label: 'Completado', color: 'green' },
  { id: 'failed', label: 'Fallido', color: 'red' }
]
```

## Vista Kanban

```tsx
// src/app/admin/(dashboard)/requests/page.tsx
export default async function RequestsPage() {
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from('requests')
    .select(`
      id, request_number, title, status, priority, created_at,
      projects(name)
    `)
    .order('created_at', { ascending: false })

  // Group by status
  const columns = requestStatuses.map(status => ({
    ...status,
    requests: requests?.filter(r => r.status === status.id) || []
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Requests</h1>
        <Link href="/admin/requests/queue">
          <Button variant="outline">Ver Cola</Button>
        </Link>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>
    </div>
  )
}
```

## Kanban Column

```tsx
function KanbanColumn({ column }: { column: KanbanColumnData }) {
  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3">
        <Badge className={`bg-${column.color}-500/20 text-${column.color}-400`}>
          {column.requests.length}
        </Badge>
        <span className="font-medium">{column.label}</span>
      </div>

      <div className="space-y-2">
        {column.requests.map(request => (
          <Link key={request.id} href={`/admin/requests/${request.id}`}>
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                  <span>#{request.request_number}</span>
                  <PriorityBadge priority={request.priority} />
                </div>
                <p className="text-sm font-medium line-clamp-2">{request.title}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {request.projects?.name}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

## Detalle de Request

```tsx
// src/app/admin/(dashboard)/requests/[id]/page.tsx
export default async function RequestDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: request } = await supabase
    .from('requests')
    .select(`
      *,
      projects(name, production_url),
      tasks(id, title, status, order_index)
    `)
    .eq('id', id)
    .single()

  // Get events
  const { data: events } = await supabase
    .from('execution_events')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">#{request.request_number}</span>
            <PriorityBadge priority={request.priority} />
          </div>
          <h1 className="text-2xl font-bold">{request.title}</h1>
          <p className="text-zinc-400">{request.projects?.name}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{request.description}</p>
            </CardContent>
          </Card>

          {/* Tasks */}
          {request.tasks?.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Tareas ({request.tasks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {request.tasks
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((task, i) => (
                    <TaskRow key={task.id} task={task} index={i + 1} />
                  ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events?.map(event => (
                  <EventItem key={event.id} event={event} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

## Skills que uso

@.claude/skills/page-admin.md
@.claude/skills/supabase-server.md
@.claude/skills/components-ui.md
