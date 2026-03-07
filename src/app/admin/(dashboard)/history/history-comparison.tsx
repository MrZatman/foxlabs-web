'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface Request {
  id: string
  request_number: number
  status: string
  priority: string
  type: string
  created_at: string
  completed_at?: string
  estimated_hours?: number
  actual_hours?: number
  projects?: {
    name: string
    client_id?: string
    clients?: { id: string; name: string }
  }
}

interface KPIs {
  total: number
  completed: number
  failed: number
  active: number
  avgTime: number
  successRate: number
  byClient: Array<{ name: string; count: number; completed: number }>
  byStatus: Record<string, number>
}

interface Props {
  requests: Request[]
  kpis: KPIs
  dateRange: { from: string; to: string }
}

const statusLabels: Record<string, string> = {
  inbox: 'Inbox',
  planning: 'Planificando',
  pending_approval: 'Esperando',
  approved: 'Aprobado',
  queued: 'En Cola',
  in_progress: 'Ejecutando',
  pending_review: 'Review',
  pending_deploy: 'Deploy',
  completed: 'Completado',
  failed: 'Fallido',
  cancelled: 'Cancelado'
}

const statusColors: Record<string, string> = {
  inbox: 'bg-zinc-500',
  planning: 'bg-blue-500',
  pending_approval: 'bg-yellow-500',
  approved: 'bg-purple-500',
  queued: 'bg-indigo-500',
  in_progress: 'bg-orange-500',
  pending_review: 'bg-cyan-500',
  pending_deploy: 'bg-pink-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-red-500'
}

export function HistoryComparison({ requests, kpis, dateRange }: Props) {
  // Group by project
  const byProject: Record<string, { name: string; count: number; completed: number }> = {}
  requests.forEach(r => {
    const projectId = r.projects?.name || 'Sin proyecto'
    if (!byProject[projectId]) {
      byProject[projectId] = { name: projectId, count: 0, completed: 0 }
    }
    byProject[projectId].count++
    if (r.status === 'completed') {
      byProject[projectId].completed++
    }
  })
  const projectRanking = Object.values(byProject).sort((a, b) => b.count - a.count).slice(0, 10)

  // Group by type
  const byType: Record<string, number> = {}
  requests.forEach(r => {
    byType[r.type] = (byType[r.type] || 0) + 1
  })

  // Group by priority
  const byPriority: Record<string, number> = {}
  requests.forEach(r => {
    byPriority[r.priority] = (byPriority[r.priority] || 0) + 1
  })

  // Group by week
  const byWeek: Record<string, { total: number; completed: number }> = {}
  requests.forEach(r => {
    const date = new Date(r.created_at)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    if (!byWeek[weekKey]) {
      byWeek[weekKey] = { total: 0, completed: 0 }
    }
    byWeek[weekKey].total++
    if (r.status === 'completed') {
      byWeek[weekKey].completed++
    }
  })
  const weeklyData = Object.entries(byWeek)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)

  // Time analysis
  const completedWithTime = requests.filter(
    r => r.status === 'completed' && r.completed_at && r.created_at
  )
  const avgTimeByPriority: Record<string, { total: number; count: number }> = {}
  completedWithTime.forEach(r => {
    const hours = (new Date(r.completed_at!).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60)
    if (!avgTimeByPriority[r.priority]) {
      avgTimeByPriority[r.priority] = { total: 0, count: 0 }
    }
    avgTimeByPriority[r.priority].total += hours
    avgTimeByPriority[r.priority].count++
  })

  const maxCount = Math.max(...Object.values(kpis.byStatus), 1)
  const maxClientCount = kpis.byClient.length > 0 ? kpis.byClient[0].count : 1
  const maxProjectCount = projectRanking.length > 0 ? projectRanking[0].count : 1

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Status Distribution */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg">Distribucion por Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(kpis.byStatus)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => (
              <div key={status} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{statusLabels[status] || status}</span>
                  <span className="text-zinc-400">{count}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${statusColors[status] || 'bg-zinc-500'}`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          {Object.keys(kpis.byStatus).length === 0 && (
            <p className="text-zinc-500 text-center py-4">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* Client Ranking */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg">Top Clientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {kpis.byClient.slice(0, 10).map((client, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="truncate max-w-[200px]">{client.name}</span>
                </div>
                <span className="text-zinc-400">
                  {client.completed}/{client.count}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${(client.count / maxClientCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {kpis.byClient.length === 0 && (
            <p className="text-zinc-500 text-center py-4">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* Project Ranking */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg">Top Proyectos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projectRanking.map((project, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="truncate max-w-[200px]">{project.name}</span>
                </div>
                <span className="text-zinc-400">
                  {project.completed}/{project.count}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(project.count / maxProjectCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {projectRanking.length === 0 && (
            <p className="text-zinc-500 text-center py-4">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* Type Distribution */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg">Por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="p-3 bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-zinc-400 capitalize">{type}</div>
              </div>
            ))}
          </div>
          {Object.keys(byType).length === 0 && (
            <p className="text-zinc-500 text-center py-4">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg">Por Prioridad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {['urgent', 'high', 'medium', 'low'].map(priority => {
              const count = byPriority[priority] || 0
              const colors: Record<string, string> = {
                urgent: 'text-red-400',
                high: 'text-orange-400',
                medium: 'text-blue-400',
                low: 'text-zinc-400'
              }
              return (
                <div key={priority} className="p-3 bg-zinc-800/50 rounded-lg">
                  <div className={`text-2xl font-bold ${colors[priority]}`}>{count}</div>
                  <div className="text-sm text-zinc-400 capitalize">{priority}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg">Tendencia Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyData.length > 0 ? (
            <div className="space-y-2">
              {weeklyData.map(([week, data]) => {
                const maxWeekly = Math.max(...weeklyData.map(d => d[1].total), 1)
                return (
                  <div key={week} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">
                        Semana {new Date(week).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                      </span>
                      <span>
                        {data.completed}/{data.total}
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${(data.total / maxWeekly) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-4">Sin datos</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
