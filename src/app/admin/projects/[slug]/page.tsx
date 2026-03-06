import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  Save,
  Github,
  ExternalLink,
  Database,
  Chrome,
  ListTodo,
  Rocket,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  planning: 'bg-blue-500/20 text-blue-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  archived: 'bg-zinc-500/20 text-zinc-400'
}

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Try to find by slug or id
  let query = supabase
    .from('projects')
    .select(`
      *,
      clients(id, name),
      chrome_profiles(id, email, name),
      supabase_projects(id, name, ref)
    `)

  // Check if slug is UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  if (isUUID) {
    query = query.eq('id', slug)
  } else {
    query = query.eq('slug', slug)
  }

  const { data: project, error } = await query.single()

  if (error || !project) {
    notFound()
  }

  // Get all clients for dropdown
  const { data: allClients } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')

  // Get all chrome profiles
  const { data: allChromeProfiles } = await supabase
    .from('chrome_profiles')
    .select('id, email, name')
    .order('email')

  // Get all supabase projects
  const { data: allSupabaseProjects } = await supabase
    .from('supabase_projects')
    .select('id, name, ref')
    .order('name')

  // Get requests
  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get deploys
  const { data: deploys } = await supabase
    .from('deploys')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get context
  const { data: context } = await supabase
    .from('project_context')
    .select('*')
    .eq('project_id', project.id)
    .single()

  async function updateProject(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const updates = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as string,
      client_id: formData.get('client_id') as string || null,
      chrome_profile_id: formData.get('chrome_profile_id') as string || null,
      supabase_project_id: formData.get('supabase_project_id') as string || null,
      github_url: formData.get('github_url') as string || null,
      vercel_url: formData.get('vercel_url') as string || null,
      production_url: formData.get('production_url') as string || null,
      folder_path: formData.get('folder_path') as string || null,
      framework: formData.get('framework') as string || null,
      node_version: formData.get('node_version') as string || null,
      updated_at: new Date().toISOString()
    }

    await supabase
      .from('projects')
      .update(updates)
      .eq('id', project.id)

    redirect(`/admin/projects/${updates.slug || project.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-zinc-400">{project.slug}</p>
        </div>
        <Badge className={statusColors[project.status] || 'bg-zinc-700'}>
          {project.status}
        </Badge>
        <div className="flex gap-2">
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon">
                <Github size={18} />
              </Button>
            </a>
          )}
          {project.production_url && (
            <a href={project.production_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon">
                <ExternalLink size={18} />
              </Button>
            </a>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
          <TabsTrigger value="requests">Requests ({requests?.length || 0})</TabsTrigger>
          <TabsTrigger value="deploys">Deploys ({deploys?.length || 0})</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form action={updateProject}>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Informacion General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={project.name}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      name="slug"
                      defaultValue={project.slug || ''}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      defaultValue={project.status}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                    >
                      <option value="planning">Planificando</option>
                      <option value="active">Activo</option>
                      <option value="paused">Pausado</option>
                      <option value="archived">Archivado</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="client_id">Cliente</Label>
                    <select
                      id="client_id"
                      name="client_id"
                      defaultValue={(project.clients as { id: string } | null)?.id || ''}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                    >
                      <option value="">Sin cliente</option>
                      {allClients?.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripcion</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={project.description || ''}
                    className="mt-1 bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="github_url">GitHub URL</Label>
                    <Input
                      id="github_url"
                      name="github_url"
                      defaultValue={project.github_url || ''}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vercel_url">Vercel URL</Label>
                    <Input
                      id="vercel_url"
                      name="vercel_url"
                      defaultValue={project.vercel_url || ''}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="production_url">Produccion URL</Label>
                    <Input
                      id="production_url"
                      name="production_url"
                      defaultValue={project.production_url || ''}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="folder_path">Folder Path</Label>
                    <Input
                      id="folder_path"
                      name="folder_path"
                      defaultValue={project.folder_path || ''}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="framework">Framework</Label>
                    <Input
                      id="framework"
                      name="framework"
                      defaultValue={project.framework || ''}
                      placeholder="next, react, vue..."
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="node_version">Node Version</Label>
                    <Input
                      id="node_version"
                      name="node_version"
                      defaultValue={project.node_version || ''}
                      placeholder="20, 18..."
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>

                {/* Hidden fields for resources */}
                <input type="hidden" name="chrome_profile_id" value={(project.chrome_profiles as { id: string } | null)?.id || ''} />
                <input type="hidden" name="supabase_project_id" value={(project.supabase_projects as { id: string } | null)?.id || ''} />

                <div className="flex justify-end">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    <Save size={16} className="mr-2" />
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="resources">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chrome size={18} />
                  Perfil Chrome
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(project.chrome_profiles as { email: string; name: string } | null) ? (
                  <div className="p-4 rounded-lg bg-zinc-800">
                    <div className="font-medium">{(project.chrome_profiles as { name: string }).name}</div>
                    <div className="text-sm text-zinc-400">{(project.chrome_profiles as { email: string }).email}</div>
                  </div>
                ) : (
                  <p className="text-zinc-500">Sin perfil asignado</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database size={18} />
                  Proyecto Supabase
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(project.supabase_projects as { name: string; ref: string } | null) ? (
                  <div className="p-4 rounded-lg bg-zinc-800">
                    <div className="font-medium">{(project.supabase_projects as { name: string }).name}</div>
                    <div className="text-sm text-zinc-400 font-mono">{(project.supabase_projects as { ref: string }).ref}</div>
                  </div>
                ) : (
                  <p className="text-zinc-500">Sin proyecto Supabase</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {!requests || requests.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Sin requests</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <Link
                      key={request.id}
                      href={`/admin/requests/${request.id}`}
                      className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <ListTodo size={20} className="text-blue-500" />
                        <div>
                          <div className="font-medium">
                            #{request.request_number} {request.title}
                          </div>
                          <div className="text-sm text-zinc-500">
                            {new Date(request.created_at).toLocaleDateString('es-MX')}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{request.status}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploys">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Historial de Deploys</CardTitle>
            </CardHeader>
            <CardContent>
              {!deploys || deploys.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Sin deploys</p>
              ) : (
                <div className="space-y-3">
                  {deploys.map((deploy) => (
                    <div
                      key={deploy.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <Rocket size={20} className={
                          deploy.status === 'success' ? 'text-green-500' :
                            deploy.status === 'failed' ? 'text-red-500' : 'text-yellow-500'
                        } />
                        <div>
                          <div className="font-medium">{deploy.commit_message || 'Deploy'}</div>
                          <div className="text-sm text-zinc-500">
                            {new Date(deploy.created_at).toLocaleString('es-MX')}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{deploy.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} />
                PROJECT_CONTEXT.md
              </CardTitle>
            </CardHeader>
            <CardContent>
              {context?.content ? (
                <pre className="p-4 rounded-lg bg-zinc-800 overflow-auto text-sm whitespace-pre-wrap">
                  {context.content}
                </pre>
              ) : (
                <p className="text-zinc-500 text-center py-8">Sin contexto generado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
