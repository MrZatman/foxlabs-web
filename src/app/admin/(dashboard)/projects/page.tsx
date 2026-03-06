import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Search, Eye, Github, ExternalLink, FolderSync } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  planning: 'bg-blue-500/20 text-blue-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  archived: 'bg-zinc-500/20 text-zinc-400'
}

const healthColors: Record<string, string> = {
  healthy: 'text-green-500',
  degraded: 'text-yellow-500',
  down: 'text-red-500'
}

export default async function ProjectsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('projects')
    .select(`
      *,
      clients(name),
      chrome_profiles(email),
      supabase_projects(name)
    `)
    .order('updated_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`)
  }

  const { data: projects } = await query.limit(100)

  // Get stats
  const { data: allProjects } = await supabase.from('projects').select('status')
  const stats = {
    total: allProjects?.length || 0,
    active: allProjects?.filter(p => p.status === 'active').length || 0,
    planning: allProjects?.filter(p => p.status === 'planning').length || 0,
    paused: allProjects?.filter(p => p.status === 'paused').length || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-zinc-400">Gestiona todos los proyectos</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/projects/import">
            <Button variant="outline">
              <FolderSync size={16} className="mr-2" />
              Importar
            </Button>
          </Link>
          <Link href="/admin/projects/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus size={16} className="mr-2" />
              Nuevo Proyecto
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBadge label="Total" value={stats.total} />
        <StatBadge label="Activos" value={stats.active} color="green" />
        <StatBadge label="Planificando" value={stats.planning} color="blue" />
        <StatBadge label="Pausados" value={stats.paused} color="yellow" />
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
                  placeholder="Buscar por nombre..."
                  defaultValue={params.search}
                  className="pl-10 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <select
              name="status"
              defaultValue={params.status || 'all'}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="all">Todos los status</option>
              <option value="active">Activo</option>
              <option value="planning">Planificando</option>
              <option value="paused">Pausado</option>
              <option value="archived">Archivado</option>
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
                  <th className="text-left p-4 text-zinc-400 font-medium">Proyecto</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden md:table-cell">Cliente</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden lg:table-cell">Chrome</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden lg:table-cell">Supabase</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Health</th>
                  <th className="text-left p-4 text-zinc-400 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {!projects || projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                      No hay proyectos
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="p-4">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-zinc-500">{project.slug}</div>
                      </td>
                      <td className="p-4 text-zinc-400 hidden md:table-cell">
                        {(project.clients as { name: string } | null)?.name || '-'}
                      </td>
                      <td className="p-4 text-zinc-400 hidden lg:table-cell text-sm">
                        {(project.chrome_profiles as { email: string } | null)?.email || '-'}
                      </td>
                      <td className="p-4 text-zinc-400 hidden lg:table-cell text-sm">
                        {(project.supabase_projects as { name: string } | null)?.name || '-'}
                      </td>
                      <td className="p-4">
                        <Badge className={statusColors[project.status] || 'bg-zinc-700'}>
                          {project.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className={`text-lg ${healthColors[project.health_status] || 'text-zinc-500'}`}>
                          {project.health_status === 'healthy' ? '🟢' :
                            project.health_status === 'degraded' ? '🟡' :
                              project.health_status === 'down' ? '🔴' : '⚪'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-white"
                            >
                              <Github size={16} />
                            </a>
                          )}
                          {project.production_url && (
                            <a
                              href={project.production_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-white"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <Link href={`/admin/projects/${project.slug || project.id}`}>
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

function StatBadge({
  label,
  value,
  color
}: {
  label: string
  value: number
  color?: 'green' | 'blue' | 'yellow'
}) {
  const colors = {
    green: 'bg-green-500/10 text-green-400',
    blue: 'bg-blue-500/10 text-blue-400',
    yellow: 'bg-yellow-500/10 text-yellow-400'
  }

  return (
    <div className={`p-4 rounded-lg ${color ? colors[color] : 'bg-zinc-800 text-zinc-300'}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  )
}
