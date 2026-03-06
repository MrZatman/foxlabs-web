import { createClient } from '@/lib/supabase/server'
import { DollarSign, CheckCircle, Clock, Users, TrendingUp, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function MetricsPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const params = await searchParams
  const period = params.period || '30d'
  const supabase = await createClient()

  // Calculate date range
  const now = new Date()
  let startDate = new Date()

  switch (period) {
    case '7d':
      startDate.setDate(now.getDate() - 7)
      break
    case '30d':
      startDate.setDate(now.getDate() - 30)
      break
    case '90d':
      startDate.setDate(now.getDate() - 90)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
    default:
      startDate.setDate(now.getDate() - 30)
  }

  // Get requests in period
  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .gte('created_at', startDate.toISOString())

  // Get completed requests
  const completedRequests = requests?.filter(r => r.status === 'completed') || []

  // Calculate metrics
  const totalRequests = requests?.length || 0
  const completedCount = completedRequests.length
  const successRate = totalRequests > 0 ? Math.round((completedCount / totalRequests) * 100) : 0

  // Calculate average time
  const avgHours = completedRequests.length > 0
    ? Math.round(completedRequests.reduce((sum, r) => sum + (r.actual_hours || r.estimated_hours || 0), 0) / completedRequests.length)
    : 0

  // Get active clients
  const { count: activeClientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })

  // Get leads
  const { data: leads } = await supabase
    .from('leads')
    .select('status')
    .gte('created_at', startDate.toISOString())

  const totalLeads = leads?.length || 0
  const convertedLeads = leads?.filter(l => l.status === 'won').length || 0
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

  // Get top clients by requests
  const { data: topClients } = await supabase
    .from('requests')
    .select('projects(clients(id, name))')
    .gte('created_at', startDate.toISOString())

  // Count requests per client
  const clientCounts: Record<string, { name: string; count: number }> = {}
  topClients?.forEach(r => {
    const client = (r.projects as unknown as { clients: { id: string; name: string } | null })?.clients
    if (client) {
      if (!clientCounts[client.id]) {
        clientCounts[client.id] = { name: client.name, count: 0 }
      }
      clientCounts[client.id].count++
    }
  })

  const sortedClients = Object.values(clientCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Get top projects
  const { data: topProjects } = await supabase
    .from('requests')
    .select('projects(id, name)')
    .gte('created_at', startDate.toISOString())

  const projectCounts: Record<string, { name: string; count: number }> = {}
  topProjects?.forEach(r => {
    const project = r.projects as unknown as { id: string; name: string } | null
    if (project) {
      if (!projectCounts[project.id]) {
        projectCounts[project.id] = { name: project.name, count: 0 }
      }
      projectCounts[project.id].count++
    }
  })

  const sortedProjects = Object.values(projectCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metricas</h1>
          <p className="text-zinc-400">Rendimiento del sistema</p>
        </div>
        <div className="flex gap-2">
          <form className="flex gap-2">
            <select
              name="period"
              defaultValue={period}
              onChange={(e) => e.target.form?.submit()}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="7d">Ultimos 7 dias</option>
              <option value="30d">Ultimos 30 dias</option>
              <option value="90d">Ultimos 90 dias</option>
              <option value="year">Este ano</option>
            </select>
          </form>
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<DollarSign size={20} />}
          label="Revenue"
          value="$0"
          color="green"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Completados"
          value={completedCount.toString()}
          color="blue"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Promedio"
          value={`${avgHours}h`}
          color="purple"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Clientes"
          value={(activeClientsCount || 0).toString()}
          color="orange"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Exito"
          value={`${successRate}%`}
          color="cyan"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Conversion"
          value={`${conversionRate}%`}
          color="yellow"
        />
      </div>

      {/* Charts placeholder */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Requests por Semana</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-zinc-500">
            Grafica de linea (proximamente)
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Distribucion por Tipo</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-zinc-500">
            Grafica de pie (proximamente)
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Top Clientes por Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedClients.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {sortedClients.map((client, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm">
                        {i + 1}
                      </span>
                      <span>{client.name}</span>
                    </div>
                    <span className="text-zinc-400">{client.count} requests</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Top Proyectos por Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedProjects.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {sortedProjects.map((project, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-sm">
                        {i + 1}
                      </span>
                      <span>{project.name}</span>
                    </div>
                    <span className="text-zinc-400">{project.count} requests</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: 'green' | 'blue' | 'purple' | 'orange' | 'cyan' | 'yellow'
}) {
  const colors = {
    green: 'text-green-500 bg-green-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
    cyan: 'text-cyan-500 bg-cyan-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10'
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-zinc-500">{label}</div>
      </CardContent>
    </Card>
  )
}
