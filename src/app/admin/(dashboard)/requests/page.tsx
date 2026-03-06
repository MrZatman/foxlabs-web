import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { List, LayoutGrid, Search, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { KanbanBoard } from './kanban-board'

const columns = [
  { id: 'inbox', label: 'Inbox', color: 'bg-zinc-500' },
  { id: 'planning', label: 'Planificando', color: 'bg-blue-500' },
  { id: 'pending_approval', label: 'Esperando Aprobacion', color: 'bg-yellow-500' },
  { id: 'approved', label: 'Aprobado', color: 'bg-purple-500' },
  { id: 'queued', label: 'En Cola', color: 'bg-indigo-500' },
  { id: 'in_progress', label: 'Ejecutando', color: 'bg-orange-500' },
  { id: 'pending_review', label: 'En Review', color: 'bg-cyan-500' },
  { id: 'pending_deploy', label: 'Desplegando', color: 'bg-pink-500' },
  { id: 'completed', label: 'Completado', color: 'bg-green-500' },
  { id: 'cancelled', label: 'Cancelado', color: 'bg-red-500' },
]

const priorityColors: Record<string, string> = {
  low: 'border-l-zinc-500',
  medium: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500'
}

export default async function RequestsPage({
  searchParams
}: {
  searchParams: Promise<{ view?: string; project?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const view = params.view || 'kanban'

  let query = supabase
    .from('requests')
    .select(`
      *,
      projects(name, slug)
    `)
    .order('created_at', { ascending: false })

  if (params.project) {
    query = query.eq('project_id', params.project)
  }

  if (params.search) {
    query = query.ilike('title', `%${params.search}%`)
  }

  const { data: requests } = await query.limit(200)

  // Get projects for filter
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Requests</h1>
          <p className="text-zinc-400">Gestiona todos los requests</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/requests/queue">
            <Button variant="outline">Cola de Ejecucion</Button>
          </Link>
          <Link href={`/admin/requests?view=${view === 'kanban' ? 'list' : 'kanban'}`}>
            <Button variant="outline" size="icon">
              {view === 'kanban' ? <List size={18} /> : <LayoutGrid size={18} />}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <form className="flex flex-col sm:flex-row gap-4">
            <input type="hidden" name="view" value={view} />
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <Input
                  name="search"
                  placeholder="Buscar por titulo..."
                  defaultValue={params.search}
                  className="pl-10 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <select
              name="project"
              defaultValue={params.project || ''}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="">Todos los proyectos</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              <Filter size={16} className="mr-2" />
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {view === 'kanban' ? (
        <KanbanBoard
          initialRequests={requests || []}
          columns={columns}
          priorityColors={priorityColors}
        />
      ) : (
        /* List View */
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-4 text-zinc-400 font-medium">#</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Titulo</th>
                    <th className="text-left p-4 text-zinc-400 font-medium hidden md:table-cell">Proyecto</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Prioridad</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
                    <th className="text-left p-4 text-zinc-400 font-medium hidden lg:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {!requests || requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">
                        No hay requests
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr key={request.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="p-4 text-zinc-500">#{request.request_number}</td>
                        <td className="p-4">
                          <Link href={`/admin/requests/${request.id}`} className="font-medium hover:text-orange-500">
                            {request.title}
                          </Link>
                        </td>
                        <td className="p-4 text-zinc-400 hidden md:table-cell">
                          {(request.projects as { name: string } | null)?.name || '-'}
                        </td>
                        <td className="p-4">
                          <Badge className={`
                            ${request.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                              request.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                request.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-zinc-500/20 text-zinc-400'}
                          `}>
                            {request.priority}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">{request.status}</Badge>
                        </td>
                        <td className="p-4 text-zinc-400 hidden lg:table-cell">
                          {new Date(request.created_at).toLocaleDateString('es-MX')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
