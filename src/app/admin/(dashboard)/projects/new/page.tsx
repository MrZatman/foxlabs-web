import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default async function NewProjectPage({
  searchParams
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Get all clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')

  // Get chrome profiles
  const { data: chromeProfiles } = await supabase
    .from('chrome_profiles')
    .select('id, email, name')
    .order('email')

  async function createProject(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const name = formData.get('name') as string
    const slug = (formData.get('slug') as string) || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const description = formData.get('description') as string
    const clientId = formData.get('client_id') as string
    const chromeProfileId = formData.get('chrome_profile_id') as string
    const folderPath = formData.get('folder_path') as string
    const framework = formData.get('framework') as string

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        slug,
        description: description || null,
        status: 'planning',
        client_id: clientId || null,
        chrome_profile_id: chromeProfileId || null,
        folder_path: folderPath || null,
        framework: framework || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return
    }

    // Log activity
    await supabase.from('activity_log').insert({
      type: 'project',
      resource_type: 'project',
      resource_id: project.id,
      message: `Nuevo proyecto creado: ${name}`,
      actor: 'admin'
    })

    redirect(`/admin/projects/${slug || project.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Proyecto</h1>
          <p className="text-zinc-400">Crea un nuevo proyecto</p>
        </div>
      </div>

      <form action={createProject} className="space-y-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Informacion Basica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Mi Proyecto"
                  className="mt-1 bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="mi-proyecto (auto-generado)"
                  className="mt-1 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe el proyecto..."
                className="mt-1 bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="client_id">Cliente</Label>
              <select
                id="client_id"
                name="client_id"
                defaultValue={params.client || ''}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              >
                <option value="">Sin cliente (proyecto interno)</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Recursos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="chrome_profile_id">Perfil Chrome</Label>
              <select
                id="chrome_profile_id"
                name="chrome_profile_id"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              >
                <option value="">Seleccionar perfil...</option>
                {chromeProfiles?.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name || profile.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="folder_path">Carpeta Local</Label>
              <Input
                id="folder_path"
                name="folder_path"
                placeholder="D:/FoxlabsProjects/mi-proyecto"
                className="mt-1 bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="framework">Framework</Label>
              <select
                id="framework"
                name="framework"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              >
                <option value="">Seleccionar...</option>
                <option value="next">Next.js</option>
                <option value="react">React</option>
                <option value="vue">Vue</option>
                <option value="nuxt">Nuxt</option>
                <option value="express">Express</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/admin/projects">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            <Save size={16} className="mr-2" />
            Crear Proyecto
          </Button>
        </div>
      </form>
    </div>
  )
}
