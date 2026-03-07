---
name: clients
description: CRUD de clientes y asignación de proyectos
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Clients Agent - FoxLabs Web 👥

Gestión de clientes y sus proyectos.

## Responsabilidades

- CRUD completo de clientes
- Asignar/desasignar proyectos a clientes
- Habilitar/deshabilitar acceso al portal
- Buscar y filtrar clientes
- Ver proyectos asociados

## Carpeta Principal

`src/app/admin/(dashboard)/clients/`

## Lista de Clientes

```tsx
// src/app/admin/(dashboard)/clients/page.tsx
export default async function ClientsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; portal?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select(`
      *,
      projects:projects(count)
    `)
    .order('created_at', { ascending: false })

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
  }

  if (params.portal === 'active') {
    query = query.eq('portal_enabled', true)
  } else if (params.portal === 'inactive') {
    query = query.eq('portal_enabled', false)
  }

  const { data: clients } = await query.limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-zinc-400">Gestiona tus clientes y sus proyectos</p>
        </div>
        <Link href="/admin/clients/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus size={16} className="mr-2" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <form className="flex gap-4">
            <Input name="search" placeholder="Buscar..." />
            <select name="portal">
              <option value="all">Todos</option>
              <option value="active">Portal activo</option>
              <option value="inactive">Portal inactivo</option>
            </select>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <ClientsTable clients={clients} />
    </div>
  )
}
```

## Nuevo Cliente

```tsx
// src/app/admin/(dashboard)/clients/new/page.tsx
export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nuevo Cliente</h1>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <form action={createClient} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de empresa</Label>
              <Input id="name" name="name" required />
            </div>

            <div>
              <Label htmlFor="contact_name">Nombre de contacto</Label>
              <Input id="contact_name" name="contact_name" />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="portal_enabled" name="portal_enabled" />
              <Label htmlFor="portal_enabled">Habilitar acceso al portal</Label>
            </div>

            <Button type="submit" className="bg-orange-500">
              Crear Cliente
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Server Action: Crear Cliente

```typescript
async function createClient(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const { error } = await supabase.from('clients').insert({
    name: formData.get('name') as string,
    contact_name: formData.get('contact_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    portal_enabled: formData.get('portal_enabled') === 'on'
  })

  if (error) throw error

  revalidatePath('/admin/clients')
  redirect('/admin/clients')
}
```

## Detalle de Cliente

```tsx
// src/app/admin/(dashboard)/clients/[id]/page.tsx
export default async function ClientDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select(`
      *,
      projects(id, name, status, production_url)
    `)
    .eq('id', id)
    .single()

  if (!client) {
    return <div>Cliente no encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-zinc-400">{client.email}</p>
        </div>
        <Badge variant={client.portal_enabled ? 'default' : 'secondary'}>
          {client.portal_enabled ? 'Portal activo' : 'Portal inactivo'}
        </Badge>
      </div>

      {/* Info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Contacto</Label>
            <p>{client.contact_name || 'N/A'}</p>
          </div>
          <div>
            <Label>Teléfono</Label>
            <p>{client.phone || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Proyectos</CardTitle>
          <Link href={`/admin/projects/new?client=${id}`}>
            <Button size="sm">Asignar Proyecto</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {client.projects?.map(project => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

## Skills que uso

@.claude/skills/page-admin.md
@.claude/skills/server-actions.md
@.claude/skills/supabase-server.md
