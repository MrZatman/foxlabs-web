import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function NewSupabaseProjectPage() {
  const supabase = await createClient()

  // Get chrome profiles for dropdown
  const { data: chromeProfiles } = await supabase
    .from('chrome_profiles')
    .select('id, email, name')
    .order('email')

  async function createSupabaseProject(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const name = formData.get('name') as string
    const ref = formData.get('ref') as string
    const region = formData.get('region') as string || 'us-east-1'
    const chromeProfileId = formData.get('chrome_profile_id') as string || null
    const anonKey = formData.get('anon_key') as string || null
    const serviceRoleKey = formData.get('service_role_key') as string || null

    const url = `https://${ref}.supabase.co`

    const { data: project, error } = await supabase
      .from('supabase_projects')
      .insert({
        name,
        ref,
        url,
        region,
        chrome_profile_id: chromeProfileId || null,
        anon_key: anonKey || null,
        service_role_key: serviceRoleKey || null,
        status: 'healthy'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating supabase project:', error)
      return
    }

    // Update chrome profile slots_used
    if (chromeProfileId) {
      const { data: profile } = await supabase
        .from('chrome_profiles')
        .select('slots_used')
        .eq('id', chromeProfileId)
        .single()

      if (profile) {
        await supabase
          .from('chrome_profiles')
          .update({ slots_used: (profile.slots_used || 0) + 1 })
          .eq('id', chromeProfileId)
      }
    }

    // Log activity
    await supabase.from('activity_log').insert({
      type: 'system',
      message: `Nuevo proyecto Supabase registrado: ${name} (${ref})`,
      actor: 'admin'
    })

    redirect(`/admin/supabase/${project.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/supabase">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Proyecto Supabase</h1>
          <p className="text-zinc-400">Registra un proyecto de Supabase existente</p>
        </div>
      </div>

      <form action={createSupabaseProject} className="max-w-xl">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Datos del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del proyecto *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Mi Proyecto"
                className="mt-1 bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="ref">Project Reference (Ref) *</Label>
              <Input
                id="ref"
                name="ref"
                required
                placeholder="rjhnwqqooshosylsoqmu"
                className="mt-1 bg-zinc-800 border-zinc-700 font-mono"
              />
              <p className="text-xs text-zinc-500 mt-1">
                El ID corto del proyecto. Lo encuentras en la URL de Supabase Dashboard.
              </p>
            </div>

            <div>
              <Label htmlFor="region">Region</Label>
              <select
                id="region"
                name="region"
                defaultValue="us-east-1"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              >
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-west-1">US West (N. California)</option>
                <option value="eu-west-1">EU West (Ireland)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                <option value="sa-east-1">South America (São Paulo)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="chrome_profile_id">Perfil Chrome asociado</Label>
              <select
                id="chrome_profile_id"
                name="chrome_profile_id"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              >
                <option value="">Sin asignar</option>
                {chromeProfiles?.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name || profile.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 mt-1">
                La cuenta de Google que contiene este proyecto Supabase.
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <h3 className="font-medium mb-4">Credenciales (opcional)</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="anon_key">Anon Key</Label>
                  <Input
                    id="anon_key"
                    name="anon_key"
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    className="mt-1 bg-zinc-800 border-zinc-700 font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="service_role_key">Service Role Key</Label>
                  <Input
                    id="service_role_key"
                    name="service_role_key"
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    className="mt-1 bg-zinc-800 border-zinc-700 font-mono text-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Guarda estos valores de forma segura. Se encriptan en la base de datos.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/admin/supabase">
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                <Save size={16} className="mr-2" />
                Crear Proyecto
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
