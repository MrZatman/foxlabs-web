import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { HistoryFilters } from './history-filters'
import { HistoryKPIs } from './history-kpis'
import { HistoryTable } from './history-table'
import { HistoryTimeline } from './history-timeline'
import { HistoryComparison } from './history-comparison'
import { ExportButtons } from './export-buttons'

interface SearchParams {
  tab?: string
  from?: string
  to?: string
  client?: string
  project?: string
  status?: string
  priority?: string
  type?: string
  source?: string
  search?: string
}

export default async function HistoryPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const activeTab = params.tab || 'table'

  // Default date range: last 365 days (to ensure all requests are visible)
  const defaultFrom = new Date()
  defaultFrom.setDate(defaultFrom.getDate() - 365)
  const fromDate = params.from || defaultFrom.toISOString().split('T')[0]
  const toDate = params.to || new Date(Date.now() + 86400000).toISOString().split('T')[0] // tomorrow to include today

  // Build query - fetch all first, then apply date filter
  let query = supabase
    .from('requests')
    .select(`
      *,
      projects(id, name, slug, client_id, clients(id, name))
    `)
    .order('created_at', { ascending: false })

  // Apply date filters only when explicitly set
  if (params.from) {
    query = query.gte('created_at', `${params.from}T00:00:00`)
  }
  if (params.to) {
    query = query.lte('created_at', `${params.to}T23:59:59`)
  }

  // Apply other filters
  if (params.project) {
    query = query.eq('project_id', params.project)
  }
  if (params.status) {
    query = query.eq('status', params.status)
  }
  if (params.priority) {
    query = query.eq('priority', params.priority)
  }
  if (params.type) {
    query = query.eq('type', params.type)
  }
  if (params.source) {
    query = query.eq('created_via', params.source)
  }
  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  const { data: requests, error } = await query.limit(500)

  // Debug: log to server console
  console.log('[History] Query result:', {
    count: requests?.length ?? 0,
    error: error?.message,
    firstRequest: requests?.[0]?.title
  })

  // Filter by client in memory (can't filter nested relation in Supabase)
  let filteredRequests = requests || []
  if (params.client && filteredRequests.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      const project = r.projects as { client_id?: string } | null
      return project?.client_id === params.client
    })
  }

  if (error) {
    console.error('Error fetching requests:', error)
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error cargando datos</h1>
        <p className="text-zinc-400">{error.message}</p>
        <pre className="mt-4 text-left text-xs bg-zinc-900 p-4 rounded overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    )
  }

  // Get filter options
  const [
    { data: clients },
    { data: projects }
  ] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('projects').select('id, name').order('name')
  ])

  // Calculate KPIs
  const totalRequests = filteredRequests.length
  const completedRequests = filteredRequests.filter(r => r.status === 'completed')
  const failedRequests = filteredRequests.filter(r => r.status === 'failed' || r.status === 'cancelled')
  const activeRequests = filteredRequests.filter(r =>
    !['completed', 'failed', 'cancelled'].includes(r.status)
  )

  // Average completion time (in hours)
  const completionTimes = completedRequests
    .filter(r => r.completed_at && r.created_at)
    .map(r => {
      const start = new Date(r.created_at).getTime()
      const end = new Date(r.completed_at).getTime()
      return (end - start) / (1000 * 60 * 60)
    })
  const avgCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
    : 0

  const successRate = totalRequests > 0
    ? Math.round((completedRequests.length / totalRequests) * 100)
    : 0

  // Group by client
  const requestsByClient: Record<string, { name: string; count: number; completed: number }> = {}
  filteredRequests.forEach(r => {
    const client = (r.projects as { clients?: { id: string; name: string } })?.clients
    if (client) {
      if (!requestsByClient[client.id]) {
        requestsByClient[client.id] = { name: client.name, count: 0, completed: 0 }
      }
      requestsByClient[client.id].count++
      if (r.status === 'completed') {
        requestsByClient[client.id].completed++
      }
    }
  })

  // Group by status
  const requestsByStatus: Record<string, number> = {}
  filteredRequests.forEach(r => {
    requestsByStatus[r.status] = (requestsByStatus[r.status] || 0) + 1
  })

  const kpis = {
    total: totalRequests,
    completed: completedRequests.length,
    failed: failedRequests.length,
    active: activeRequests.length,
    avgTime: Math.round(avgCompletionTime * 10) / 10,
    successRate,
    byClient: Object.values(requestsByClient).sort((a, b) => b.count - a.count),
    byStatus: requestsByStatus
  }

  const filterValues = {
    from: fromDate,
    to: toDate,
    client: params.client || '',
    project: params.project || '',
    status: params.status || '',
    priority: params.priority || '',
    type: params.type || '',
    source: params.source || '',
    search: params.search || ''
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historial de Requests</h1>
          <p className="text-zinc-400">
            {totalRequests} requests del {fromDate} al {toDate}
          </p>
        </div>
        <ExportButtons
          requests={filteredRequests}
          kpis={kpis}
          dateRange={{ from: fromDate, to: toDate }}
        />
      </div>

      {/* Filters */}
      <HistoryFilters
        clients={clients || []}
        projects={projects || []}
        values={filterValues}
      />

      {/* KPIs */}
      <HistoryKPIs kpis={kpis} />

      {/* Tabs */}
      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="table">Tabla</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="comparison">Comparativas</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Suspense fallback={<LoadingState />}>
            <HistoryTable requests={filteredRequests} />
          </Suspense>
        </TabsContent>

        <TabsContent value="timeline">
          <Suspense fallback={<LoadingState />}>
            <HistoryTimeline requests={filteredRequests} />
          </Suspense>
        </TabsContent>

        <TabsContent value="comparison">
          <Suspense fallback={<LoadingState />}>
            <HistoryComparison
              requests={filteredRequests}
              kpis={kpis}
              dateRange={{ from: fromDate, to: toDate }}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="cards">
          <Suspense fallback={<LoadingState />}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))}
              {filteredRequests.length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500">
                  No hay requests en el periodo seleccionado
                </div>
              )}
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LoadingState() {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" size={32} />
      </CardContent>
    </Card>
  )
}

function RequestCard({ request }: { request: Record<string, unknown> }) {
  const project = request.projects as { name?: string; clients?: { name?: string } } | null

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

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-zinc-500 text-sm">#{request.request_number as number}</span>
          <div className={`w-2 h-2 rounded-full ${statusColors[request.status as string] || 'bg-zinc-500'}`} />
        </div>
        <h3 className="font-medium line-clamp-2 mb-2">{request.title as string}</h3>
        <div className="text-sm text-zinc-400 space-y-1">
          <div>{project?.name || 'Sin proyecto'}</div>
          {project?.clients?.name && (
            <div className="text-zinc-500">{project.clients.name}</div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
          {new Date(request.created_at as string).toLocaleDateString('es-MX')}
        </div>
      </CardContent>
    </Card>
  )
}
