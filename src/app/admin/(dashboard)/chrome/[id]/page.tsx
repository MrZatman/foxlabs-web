import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Save, RefreshCw, Database, FolderKanban, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

export default async function ChromeProfileDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('chrome_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !profile) {
    notFound()
  }

  // Get Supabase projects for this profile
  const { data: supabaseProjects } = await supabase
    .from('supabase_projects')
    .select(`
      *,
      projects(id, name, slug)
    `)
    .eq('chrome_profile_id', id)
    .order('name')

  // Get system projects using this profile
  const { data: systemProjects } = await supabase
    .from('projects')
    .select('id, name, slug, clients(name)')
    .eq('chrome_profile_id', id)
    .order('name')

  const slotsUsed = supabaseProjects?.length || 0
  const slotsTotal = profile.slots_total || 2
  const slotsPercent = (slotsUsed / slotsTotal) * 100

  const isTokenValid = profile.token_expires_at
    ? new Date(profile.token_expires_at) > new Date()
    : true

  async function updateProfile(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const updates = {
      name: formData.get('name') as string,
      slots_total: parseInt(formData.get('slots_total') as string) || 2,
      updated_at: new Date().toISOString()
    }

    await supabase
      .from('chrome_profiles')
      .update(updates)
      .eq('id', id)

    redirect(`/admin/chrome/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/chrome">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.name || profile.email}</h1>
          <p className="text-zinc-400">{profile.email}</p>
        </div>
        {isTokenValid ? (
          <Badge className="bg-green-500/20 text-green-400">
            <CheckCircle size={14} className="mr-1" />
            Token valido
          </Badge>
        ) : (
          <Badge className="bg-red-500/20 text-red-400">
            <AlertCircle size={14} className="mr-1" />
            Token expirado
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <form action={updateProfile}>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Informacion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={profile.name || ''}
                      placeholder="Nombre descriptivo"
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="slots_total">Slots Totales</Label>
                  <Input
                    id="slots_total"
                    name="slots_total"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={profile.slots_total || 2}
                    className="mt-1 bg-zinc-800 border-zinc-700 w-32"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Numero de proyectos Supabase permitidos
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    <Save size={16} className="mr-2" />
                    Guardar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Supabase Projects */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database size={18} />
                Proyectos Supabase ({slotsUsed}/{slotsTotal})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress
                value={slotsPercent}
                className={`h-2 mb-4 ${
                  slotsPercent >= 100 ? '[&>div]:bg-red-500' :
                  slotsPercent >= 80 ? '[&>div]:bg-yellow-500' :
                  '[&>div]:bg-green-500'
                }`}
              />

              {!supabaseProjects || supabaseProjects.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">Sin proyectos Supabase</p>
              ) : (
                <div className="space-y-3">
                  {supabaseProjects.map((sp) => (
                    <Link
                      key={sp.id}
                      href={`/admin/supabase/${sp.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800"
                    >
                      <div>
                        <div className="font-medium">{sp.name}</div>
                        <div className="text-sm text-zinc-500 font-mono">{sp.ref}</div>
                      </div>
                      {(sp.projects as unknown as { name: string } | null) ? (
                        <Badge variant="secondary">
                          {(sp.projects as unknown as { name: string }).name}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400">Libre</Badge>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Projects */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban size={18} />
                Proyectos del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!systemProjects || systemProjects.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">Ningun proyecto usa este perfil</p>
              ) : (
                <div className="space-y-3">
                  {systemProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/admin/projects/${project.slug || project.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800"
                    >
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-zinc-500">
                          {(project.clients as unknown as { name: string } | null)?.name || 'Sin cliente'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Token Card */}
          <Card className={`bg-zinc-900 border-zinc-800 ${!isTokenValid ? 'border-red-500/50' : 'border-green-500/50'}`}>
            <CardHeader>
              <CardTitle>Token de Acceso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {isTokenValid ? (
                  <CheckCircle size={24} className="text-green-500" />
                ) : (
                  <AlertCircle size={24} className="text-red-500" />
                )}
                <div>
                  <div className="font-medium">
                    {isTokenValid ? 'Valido' : 'Expirado'}
                  </div>
                  {profile.token_expires_at && (
                    <div className="text-sm text-zinc-400">
                      {isTokenValid ? 'Expira' : 'Expiro'}: {new Date(profile.token_expires_at).toLocaleDateString('es-MX')}
                    </div>
                  )}
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <RefreshCw size={16} className="mr-2" />
                Refrescar Token
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Estadisticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Proyectos Supabase</span>
                <span>{slotsUsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Proyectos Sistema</span>
                <span>{systemProjects?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Slots disponibles</span>
                <span className={slotsTotal - slotsUsed <= 0 ? 'text-red-400' : 'text-green-400'}>
                  {Math.max(0, slotsTotal - slotsUsed)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
