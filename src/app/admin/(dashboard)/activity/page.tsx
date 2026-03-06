import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Users,
  Briefcase,
  FolderKanban,
  ListTodo,
  Rocket,
  AlertCircle,
  Settings,
  Search,
  Filter
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const typeIcons: Record<string, React.ReactNode> = {
  lead: <Users size={16} />,
  client: <Briefcase size={16} />,
  project: <FolderKanban size={16} />,
  request: <ListTodo size={16} />,
  deploy: <Rocket size={16} />,
  error: <AlertCircle size={16} />,
  system: <Settings size={16} />
}

const typeColors: Record<string, string> = {
  lead: 'bg-blue-500',
  client: 'bg-green-500',
  project: 'bg-purple-500',
  request: 'bg-orange-500',
  deploy: 'bg-cyan-500',
  error: 'bg-red-500',
  system: 'bg-zinc-500'
}

export default async function ActivityPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string; search?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const page = parseInt(params.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  let query = supabase
    .from('activity_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.type && params.type !== 'all') {
    query = query.eq('type', params.type)
  }

  if (params.search) {
    query = query.ilike('message', `%${params.search}%`)
  }

  const { data: activities, count } = await query

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-zinc-400">Historial de actividad del sistema</p>
        </div>
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
                  placeholder="Buscar en actividad..."
                  defaultValue={params.search}
                  className="pl-10 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <select
              name="type"
              defaultValue={params.type || 'all'}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="all">Todos los tipos</option>
              <option value="lead">Leads</option>
              <option value="client">Clientes</option>
              <option value="project">Proyectos</option>
              <option value="request">Requests</option>
              <option value="deploy">Deploys</option>
              <option value="system">Sistema</option>
              <option value="error">Errores</option>
            </select>
            <Button type="submit" variant="secondary">
              <Filter size={16} className="mr-2" />
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          {!activities || activities.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">Sin actividad</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const icon = typeIcons[activity.type] || <Settings size={16} />
                const color = typeColors[activity.type] || 'bg-zinc-500'
                const time = new Date(activity.created_at)
                const isNewDay = index === 0 ||
                  new Date(activities[index - 1].created_at).toDateString() !== time.toDateString()

                return (
                  <div key={activity.id}>
                    {isNewDay && (
                      <div className="text-sm text-zinc-500 font-medium py-2 border-b border-zinc-800 mb-4">
                        {time.toLocaleDateString('es-MX', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white`}>
                          {icon}
                        </div>
                        {index < activities.length - 1 && (
                          <div className="w-0.5 flex-1 bg-zinc-800 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-zinc-200">{activity.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {activity.type}
                              </Badge>
                              <span className="text-xs text-zinc-500">
                                {time.toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {activity.actor && (
                                <span className="text-xs text-zinc-500">
                                  por {activity.actor}
                                </span>
                              )}
                            </div>
                          </div>
                          {activity.resource_type && activity.resource_id && (
                            <Link
                              href={`/admin/${activity.resource_type}s/${activity.resource_id}`}
                              className="text-xs text-orange-500 hover:underline"
                            >
                              Ver
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-zinc-800">
              {page > 1 && (
                <Link href={`/admin/activity?page=${page - 1}&type=${params.type || ''}&search=${params.search || ''}`}>
                  <Button variant="outline" size="sm">Anterior</Button>
                </Link>
              )}
              <span className="text-sm text-zinc-400">
                Pagina {page} de {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`/admin/activity?page=${page + 1}&type=${params.type || ''}&search=${params.search || ''}`}>
                  <Button variant="outline" size="sm">Siguiente</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
