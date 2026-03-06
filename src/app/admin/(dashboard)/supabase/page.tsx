import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Search, Eye, ExternalLink, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default async function SupabaseProjectsPage({
  searchParams
}: {
  searchParams: Promise<{ profile?: string; assigned?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('supabase_projects')
    .select(`
      *,
      chrome_profiles(id, email, name),
      projects(id, name, slug)
    `)
    .order('name')

  if (params.profile) {
    query = query.eq('chrome_profile_id', params.profile)
  }

  if (params.assigned === 'true') {
    query = query.not('project_id', 'is', null)
  } else if (params.assigned === 'false') {
    query = query.is('project_id', null)
  }

  const { data: supabaseProjects } = await query.limit(100)

  // Get chrome profiles for filter
  const { data: chromeProfiles } = await supabase
    .from('chrome_profiles')
    .select('id, email, name')
    .order('email')

  // Stats
  const total = supabaseProjects?.length || 0
  const assigned = supabaseProjects?.filter(p => p.project_id).length || 0
  const free = total - assigned

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proyectos Supabase</h1>
          <p className="text-zinc-400">Gestiona tus proyectos de Supabase</p>
        </div>
        <Button variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Sincronizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-zinc-800">
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-sm text-zinc-400">Total</div>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/10 text-blue-400">
          <div className="text-2xl font-bold">{assigned}</div>
          <div className="text-sm opacity-80">Asignados</div>
        </div>
        <div className="p-4 rounded-lg bg-green-500/10 text-green-400">
          <div className="text-2xl font-bold">{free}</div>
          <div className="text-sm opacity-80">Libres</div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <form className="flex flex-col sm:flex-row gap-4">
            <select
              name="profile"
              defaultValue={params.profile || ''}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="">Todos los perfiles</option>
              {chromeProfiles?.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name || profile.email}
                </option>
              ))}
            </select>
            <select
              name="assigned"
              defaultValue={params.assigned || ''}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="">Todos</option>
              <option value="true">Asignados</option>
              <option value="false">Libres</option>
            </select>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-zinc-400 font-medium">Nombre</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Ref</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden md:table-cell">Perfil Chrome</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Proyecto</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden lg:table-cell">Region</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
                  <th className="text-left p-4 text-zinc-400 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {!supabaseProjects || supabaseProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                      No hay proyectos Supabase
                    </td>
                  </tr>
                ) : (
                  supabaseProjects.map((sp) => (
                    <tr key={sp.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="p-4 font-medium">{sp.name}</td>
                      <td className="p-4 text-zinc-400 font-mono text-sm">{sp.ref}</td>
                      <td className="p-4 text-zinc-400 hidden md:table-cell text-sm">
                        {(sp.chrome_profiles as { email: string } | null)?.email || '-'}
                      </td>
                      <td className="p-4">
                        {(sp.projects as { name: string } | null) ? (
                          <Link
                            href={`/admin/projects/${(sp.projects as { slug: string })?.slug || (sp.projects as { id: string })?.id}`}
                            className="hover:text-orange-500"
                          >
                            {(sp.projects as { name: string }).name}
                          </Link>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400">Libre</Badge>
                        )}
                      </td>
                      <td className="p-4 text-zinc-400 hidden lg:table-cell">{sp.region || '-'}</td>
                      <td className="p-4">
                        <Badge className={
                          sp.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                          sp.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-zinc-500/20 text-zinc-400'
                        }>
                          {sp.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {sp.url && (
                            <a
                              href={sp.url.replace('supabase.co', 'supabase.com/project/').replace('https://', 'https://supabase.com/dashboard/project/')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-white"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <Link href={`/admin/supabase/${sp.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye size={16} />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
