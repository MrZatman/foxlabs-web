---
name: projects
description: CRUD de proyectos y vinculación con recursos
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Projects Agent - FoxLabs Web 📁

Gestión de proyectos y sus configuraciones.

## Responsabilidades

- CRUD completo de proyectos
- Vincular cliente, Chrome profile, Supabase
- Configurar folder_path y production_url
- Configurar github_repo y default_branch
- Importar proyectos existentes

## Carpeta Principal

`src/app/admin/(dashboard)/projects/`

## Lista de Proyectos

```tsx
// src/app/admin/(dashboard)/projects/page.tsx
export default async function ProjectsPage({
  searchParams
}: {
  searchParams: Promise<{ client?: string; status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('projects')
    .select(`
      *,
      clients(name),
      chrome_profiles(name),
      requests:requests(count)
    `)
    .order('created_at', { ascending: false })

  if (params.client) {
    query = query.eq('client_id', params.client)
  }

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: projects } = await query.limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-zinc-400">Gestiona tus proyectos</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/projects/import">
            <Button variant="outline">Importar</Button>
          </Link>
          <Link href="/admin/projects/new">
            <Button className="bg-orange-500">
              <Plus size={16} className="mr-2" />
              Nuevo Proyecto
            </Button>
          </Link>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
```

## Detalle/Edición de Proyecto

```tsx
// src/app/admin/(dashboard)/projects/[slug]/page.tsx
export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      clients(id, name),
      chrome_profiles(id, name),
      requests(id, request_number, title, status)
    `)
    .eq('slug', slug)
    .single()

  if (!project) {
    return <div>Proyecto no encontrado</div>
  }

  // Get available resources
  const [
    { data: clients },
    { data: chromeProfiles }
  ] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('chrome_profiles').select('id, name').order('name')
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-zinc-400">{project.slug}</p>
        </div>
        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
          {project.status}
        </Badge>
      </div>

      {/* Edit Form */}
      <form action={updateProject}>
        <input type="hidden" name="id" value={project.id} />

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={project.name} />
            </div>

            <div>
              <Label htmlFor="client_id">Cliente</Label>
              <Select name="client_id" defaultValue={project.client_id}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="folder_path">Folder Path</Label>
              <Input id="folder_path" name="folder_path" defaultValue={project.folder_path} />
            </div>

            <div>
              <Label htmlFor="github_repo">GitHub Repo</Label>
              <Input id="github_repo" name="github_repo" defaultValue={project.github_repo} />
            </div>

            <div>
              <Label htmlFor="production_url">Production URL</Label>
              <Input id="production_url" name="production_url" defaultValue={project.production_url} />
            </div>

            <div>
              <Label htmlFor="chrome_profile_id">Chrome Profile</Label>
              <Select name="chrome_profile_id" defaultValue={project.chrome_profile_id}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin perfil</SelectItem>
                  {chromeProfiles?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="bg-orange-500">
              Guardar Cambios
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Recent Requests */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Requests Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {project.requests?.map(req => (
            <RequestRow key={req.id} request={req} />
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-zinc-900 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400">Zona de Peligro</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={deleteProject}>
            <input type="hidden" name="id" value={project.id} />
            <Button variant="destructive" type="submit">
              Eliminar Proyecto
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Server Actions

```typescript
async function updateProject(formData: FormData) {
  'use server'

  const supabase = await createClient()

  await supabase
    .from('projects')
    .update({
      name: formData.get('name'),
      client_id: formData.get('client_id') || null,
      folder_path: formData.get('folder_path'),
      github_repo: formData.get('github_repo'),
      production_url: formData.get('production_url'),
      chrome_profile_id: formData.get('chrome_profile_id') || null
    })
    .eq('id', formData.get('id'))

  revalidatePath('/admin/projects')
}

async function deleteProject(formData: FormData) {
  'use server'

  const supabase = await createClient()

  await supabase
    .from('projects')
    .delete()
    .eq('id', formData.get('id'))

  revalidatePath('/admin/projects')
  redirect('/admin/projects')
}
```

## Skills que uso

@.claude/skills/page-admin.md
@.claude/skills/server-actions.md
@.claude/skills/supabase-server.md
