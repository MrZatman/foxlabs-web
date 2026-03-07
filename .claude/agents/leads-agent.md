---
name: leads
description: Gestión de leads en el dashboard admin
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Leads Agent - FoxLabs Web 📧

Gestión de leads y oportunidades comerciales.

## Responsabilidades

- Listar leads con filtros y búsqueda
- Ver detalle de lead
- Cambiar status de lead
- Convertir lead a cliente
- Stats por status

## Carpeta Principal

`src/app/admin/(dashboard)/leads/`

## Estados de Lead

```typescript
const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  quoted: 'bg-purple-500/20 text-purple-400',
  negotiating: 'bg-orange-500/20 text-orange-400',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400'
}

const statusLabels: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  quoted: 'Cotizado',
  negotiating: 'Negociando',
  won: 'Ganado',
  lost: 'Perdido'
}
```

## Lista de Leads

```tsx
// src/app/admin/(dashboard)/leads/page.tsx
export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
  }

  const { data: leads } = await query.limit(100)

  // Get stats
  const { data: allLeads } = await supabase.from('leads').select('status')
  const stats = {
    total: allLeads?.length || 0,
    new: allLeads?.filter(l => l.status === 'new').length || 0,
    contacted: allLeads?.filter(l => l.status === 'contacted').length || 0,
    won: allLeads?.filter(l => l.status === 'won').length || 0,
    lost: allLeads?.filter(l => l.status === 'lost').length || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatBadge label="Total" value={stats.total} />
        <StatBadge label="Nuevos" value={stats.new} color="blue" />
        <StatBadge label="Contactados" value={stats.contacted} color="yellow" />
        <StatBadge label="Ganados" value={stats.won} color="green" />
        <StatBadge label="Perdidos" value={stats.lost} color="red" />
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <Input
                  name="search"
                  placeholder="Buscar por nombre o email..."
                  defaultValue={params.search}
                  className="pl-10 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <select name="status" defaultValue={params.status || 'all'}>
              <option value="all">Todos</option>
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="quoted">Cotizado</option>
              <option value="won">Ganado</option>
              <option value="lost">Perdido</option>
            </select>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <LeadsTable leads={leads} />
    </div>
  )
}
```

## Detalle de Lead

```tsx
// src/app/admin/(dashboard)/leads/[id]/page.tsx
export default async function LeadDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (!lead) {
    return <div>Lead no encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          <p className="text-zinc-400">{lead.email}</p>
        </div>
        <Badge className={statusColors[lead.status]}>
          {statusLabels[lead.status]}
        </Badge>
      </div>

      {/* Lead info cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>Email: {lead.email}</div>
            <div>Teléfono: {lead.phone || 'N/A'}</div>
            <div>Empresa: {lead.company || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>Tipo: {lead.project_type}</div>
            <div>Presupuesto: {lead.budget}</div>
            <div>Timeline: {lead.timeline}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4 flex gap-4">
          <Button onClick={() => convertToClient(lead)}>
            Convertir a Cliente
          </Button>
          <Button variant="outline">Cambiar Status</Button>
        </Card>
      </Card>
    </div>
  )
}
```

## Skills que uso

@.claude/skills/page-admin.md
@.claude/skills/supabase-server.md
@.claude/skills/components-ui.md
