import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  Save,
  FolderKanban,
  ListTodo,
  KeyRound,
  ExternalLink,
  Github,
  Plus,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

export default async function ClientDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) {
    notFound()
  }

  // Get assigned projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  // Get unassigned projects (for dropdown)
  const { data: unassignedProjects } = await supabase
    .from('projects')
    .select('id, name, slug')
    .is('client_id', null)
    .order('name')

  // Get requests
  const { data: requests } = await supabase
    .from('requests')
    .select('*, projects(name)')
    .in('project_id', projects?.map(p => p.id) || [])
    .order('created_at', { ascending: false })
    .limit(20)

  async function updateClient(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const updates = {
      name: formData.get('name') as string,
      contact_name: formData.get('contact_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      whatsapp: formData.get('whatsapp') as string,
      notes: formData.get('notes') as string,
      is_vip: formData.get('is_vip') === 'on',
      updated_at: new Date().toISOString()
    }

    await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)

    redirect(`/admin/clients/${id}`)
  }

  async function assignProject(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const projectId = formData.get('project_id') as string

    if (!projectId) return

    await supabase
      .from('projects')
      .update({
        client_id: id,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    // Log activity
    await supabase.from('activity_log').insert({
      type: 'project',
      resource_type: 'project',
      resource_id: projectId,
      message: `Proyecto asignado a cliente: ${client.name}`,
      actor: 'admin'
    })

    redirect(`/admin/clients/${id}`)
  }

  async function unassignProject(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const projectId = formData.get('project_id') as string

    await supabase
      .from('projects')
      .update({
        client_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    // Log activity
    await supabase.from('activity_log').insert({
      type: 'project',
      resource_type: 'project',
      resource_id: projectId,
      message: `Proyecto desasignado de cliente: ${client.name}`,
      actor: 'admin'
    })

    redirect(`/admin/clients/${id}`)
  }

  async function togglePortal(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const enable = formData.get('enable') === 'true'

    await supabase
      .from('clients')
      .update({
        portal_enabled: enable,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    redirect(`/admin/clients/${id}`)
  }

  async function resetPassword() {
    'use server'

    const supabase = await createClient()
    const newPassword = Math.random().toString(36).slice(-8) + 'A1!'

    const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN
    const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

    if (ADMIN_BOT_TOKEN && ADMIN_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: `<b>Password reset solicitado</b>\n\nCliente: ${client.name}\nEmail: ${client.email}\nNuevo password: <code>${newPassword}</code>`,
          parse_mode: 'HTML'
        })
      })
    }

    redirect(`/admin/clients/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-zinc-400">{client.email}</p>
        </div>
        {client.is_vip && (
          <Badge className="bg-yellow-500/20 text-yellow-400">VIP</Badge>
        )}
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="info">Informacion</TabsTrigger>
          <TabsTrigger value="projects">Proyectos ({projects?.length || 0})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({requests?.length || 0})</TabsTrigger>
          <TabsTrigger value="portal">Portal</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <form action={updateClient}>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Datos del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre de Empresa</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={client.name}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_name">Nombre de Contacto</Label>
                    <Input
                      id="contact_name"
                      name="contact_name"
                      defaultValue={client.contact_name || ''}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={client.email}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={client.phone || ''}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      defaultValue={client.whatsapp || ''}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={client.notes || ''}
                    className="mt-1 bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_vip"
                    name="is_vip"
                    defaultChecked={client.is_vip}
                  />
                  <Label htmlFor="is_vip">Cliente VIP</Label>
                </div>

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

        <TabsContent value="projects">
          <div className="space-y-4">
            {/* Assign existing project */}
            {unassignedProjects && unassignedProjects.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base">Asignar proyecto existente</CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={assignProject} className="flex gap-2">
                    <select
                      name="project_id"
                      className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                      required
                    >
                      <option value="">Seleccionar proyecto...</option>
                      {unassignedProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      <Plus size={16} className="mr-2" />
                      Asignar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Projects list */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Proyectos Asignados</CardTitle>
                <Link href={`/admin/projects/new?client=${id}`}>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <Plus size={16} className="mr-2" />
                    Nuevo Proyecto
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {!projects || projects.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">Sin proyectos asignados</p>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50"
                      >
                        <Link
                          href={`/admin/projects/${project.slug || project.id}`}
                          className="flex items-center gap-3 flex-1 hover:opacity-80"
                        >
                          <FolderKanban size={20} className="text-orange-500" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{project.name}</div>
                            <div className="flex items-center gap-3 text-sm text-zinc-500">
                              <Badge variant="secondary" className="text-xs">
                                {project.status}
                              </Badge>
                              {project.framework && (
                                <span>{project.framework}</span>
                              )}
                            </div>
                          </div>
                        </Link>

                        <div className="flex items-center gap-2">
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white"
                              title="GitHub"
                            >
                              <Github size={16} />
                            </a>
                          )}
                          {project.production_url && (
                            <a
                              href={project.production_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white"
                              title="Produccion"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <form action={unassignProject}>
                            <input type="hidden" name="project_id" value={project.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Desasignar"
                            >
                              <X size={16} />
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
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
                            {(request.projects as { name: string } | null)?.name || 'Sin proyecto'}
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

        <TabsContent value="portal">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Acceso al Portal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                <div>
                  <div className="font-medium">Estado del Portal</div>
                  <div className="text-sm text-zinc-400">
                    {client.portal_enabled ? 'El cliente puede acceder' : 'Acceso deshabilitado'}
                  </div>
                </div>
                <form action={togglePortal}>
                  <input type="hidden" name="enable" value={client.portal_enabled ? 'false' : 'true'} />
                  <Button
                    type="submit"
                    variant={client.portal_enabled ? 'destructive' : 'default'}
                    size="sm"
                  >
                    {client.portal_enabled ? 'Deshabilitar' : 'Habilitar'}
                  </Button>
                </form>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <div className="text-sm text-zinc-400 mb-1">Email de acceso</div>
                  <div className="font-mono">{client.email}</div>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <div className="text-sm text-zinc-400 mb-1">Ultimo acceso</div>
                  <div>
                    {client.portal_last_login
                      ? new Date(client.portal_last_login).toLocaleString('es-MX')
                      : 'Nunca'}
                  </div>
                </div>
              </div>

              <form action={resetPassword}>
                <Button type="submit" variant="outline" className="w-full">
                  <KeyRound size={16} className="mr-2" />
                  Generar nuevo password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
