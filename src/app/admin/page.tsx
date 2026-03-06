import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Users,
  Briefcase,
  FolderKanban,
  ListTodo,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  PlayCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get stats
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    { count: newLeadsCount },
    { count: activeClientsCount },
    { count: totalProjectsCount },
    { data: requests },
    { count: queueCount },
    { data: recentActivity },
    { data: pendingLeads },
    { data: pendingApproval },
    { data: pendingQuestions }
  ] = await Promise.all([
    // Leads last 7 days
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),

    // Active clients
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true }),

    // Total projects
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true }),

    // Requests for stats
    supabase
      .from('requests')
      .select('status, created_at'),

    // Queue count
    supabase
      .from('execution_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Recent activity
    supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),

    // Leads without contact (>24h)
    supabase
      .from('leads')
      .select('id, name, created_at')
      .eq('status', 'new')
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(5),

    // Requests pending approval
    supabase
      .from('requests')
      .select('id, request_number, title')
      .eq('status', 'pending_approval')
      .limit(5),

    // Unanswered questions
    supabase
      .from('questions')
      .select('id, question, request_id')
      .is('answer', null)
      .limit(5)
  ])

  // Calculate request stats
  const pendingCount = requests?.filter(r =>
    ['pending', 'planning', 'pending_approval', 'queued'].includes(r.status)
  ).length || 0

  const inProgressCount = requests?.filter(r =>
    r.status === 'in_progress'
  ).length || 0

  const today = new Date().toDateString()
  const completedTodayCount = requests?.filter(r =>
    r.status === 'completed' && new Date(r.created_at).toDateString() === today
  ).length || 0

  const hasAlerts = (pendingLeads?.length || 0) > 0 ||
    (pendingApproval?.length || 0) > 0 ||
    (pendingQuestions?.length || 0) > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-400">Resumen del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Users size={20} />}
          label="Leads (7d)"
          value={newLeadsCount || 0}
          href="/admin/leads"
          color="blue"
        />
        <StatCard
          icon={<Briefcase size={20} />}
          label="Clientes"
          value={activeClientsCount || 0}
          href="/admin/clients"
          color="green"
        />
        <StatCard
          icon={<FolderKanban size={20} />}
          label="Proyectos"
          value={totalProjectsCount || 0}
          href="/admin/projects"
          color="purple"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Pendientes"
          value={pendingCount}
          href="/admin/requests"
          color="yellow"
        />
        <StatCard
          icon={<PlayCircle size={20} />}
          label="En Progreso"
          value={inProgressCount}
          href="/admin/requests"
          color="orange"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Hoy"
          value={completedTodayCount}
          href="/admin/requests"
          color="green"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alerts Section */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className={hasAlerts ? 'text-yellow-500' : 'text-zinc-500'} />
              Requiere tu atencion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasAlerts ? (
              <p className="text-zinc-500 text-center py-4">Todo al dia</p>
            ) : (
              <div className="space-y-3">
                {pendingLeads && pendingLeads.length > 0 && (
                  <AlertItem
                    icon={<Users size={16} />}
                    title="Leads sin contactar (+24h)"
                    count={pendingLeads.length}
                    href="/admin/leads?status=new"
                    color="yellow"
                  />
                )}
                {pendingApproval && pendingApproval.length > 0 && (
                  <AlertItem
                    icon={<ListTodo size={16} />}
                    title="Requests pendientes de aprobacion"
                    count={pendingApproval.length}
                    href="/admin/requests?status=pending_approval"
                    color="blue"
                  />
                )}
                {pendingQuestions && pendingQuestions.length > 0 && (
                  <AlertItem
                    icon={<AlertTriangle size={16} />}
                    title="Preguntas sin responder"
                    count={pendingQuestions.length}
                    href="/admin/requests"
                    color="red"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span>FoxOrchestrator</span>
              </div>
              <Badge variant="secondary">Online</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <ListTodo size={16} />
                <span>Cola de ejecucion</span>
              </div>
              <Badge variant="secondary">{queueCount || 0} en cola</Badge>
            </div>

            <Link href="/admin/requests/queue">
              <Button variant="outline" className="w-full">
                Ver cola de ejecucion
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Ultimas 20 acciones del sistema</CardDescription>
          </div>
          <Link href="/admin/activity">
            <Button variant="ghost" size="sm">
              Ver todo
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {!recentActivity || recentActivity.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">Sin actividad reciente</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  href,
  color
}: {
  icon: React.ReactNode
  label: string
  value: number
  href: string
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'orange' | 'red'
}) {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/10',
    green: 'text-green-500 bg-green-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
    red: 'text-red-500 bg-red-500/10'
  }

  return (
    <Link href={href}>
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
            {icon}
          </div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-zinc-500">{label}</div>
        </CardContent>
      </Card>
    </Link>
  )
}

function AlertItem({
  icon,
  title,
  count,
  href,
  color
}: {
  icon: React.ReactNode
  title: string
  count: number
  href: string
  color: 'yellow' | 'blue' | 'red'
}) {
  const colors = {
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400'
  }

  return (
    <Link href={href}>
      <div className={`flex items-center justify-between p-3 rounded-lg border ${colors[color]} hover:opacity-80 transition-opacity`}>
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm">{title}</span>
        </div>
        <Badge variant="secondary">{count}</Badge>
      </div>
    </Link>
  )
}

function ActivityItem({ activity }: { activity: { id: string; type: string; message: string; created_at: string } }) {
  const typeIcons: Record<string, React.ReactNode> = {
    lead: <Users size={14} />,
    client: <Briefcase size={14} />,
    project: <FolderKanban size={14} />,
    request: <ListTodo size={14} />,
    deploy: <CheckCircle size={14} />,
    error: <XCircle size={14} />,
  }

  const icon = typeIcons[activity.type] || <Clock size={14} />
  const time = new Date(activity.created_at).toLocaleString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short'
  })

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-800/50">
      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 truncate">{activity.message}</p>
        <p className="text-xs text-zinc-500">{time}</p>
      </div>
    </div>
  )
}
