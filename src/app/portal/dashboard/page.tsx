import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, FileText, Clock, CheckCircle, AlertCircle, ExternalLink, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  // Get client info
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!client) {
    return (
      <PortalLayout user={user}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Cuenta no encontrada</h2>
          <p className="text-zinc-400">
            Tu email no esta asociado a ningun cliente. Contacta soporte.
          </p>
        </div>
      </PortalLayout>
    )
  }

  // Get projects for this client
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, production_url, status')
    .eq('client_id', client.id)

  // Get recent requests
  const { data: requests } = await supabase
    .from('requests')
    .select(`
      id,
      request_number,
      title,
      status,
      created_at,
      projects(name)
    `)
    .in('project_id', projects?.map(p => p.id) || [])
    .order('created_at', { ascending: false })
    .limit(5)

  // Count requests by status
  const pendingCount = requests?.filter(r => ['inbox', 'planning', 'approved', 'queued'].includes(r.status)).length || 0
  const inProgressCount = requests?.filter(r => ['in_progress', 'deploying', 'review'].includes(r.status)).length || 0
  const completedCount = requests?.filter(r => ['deployed', 'completed'].includes(r.status)).length || 0

  return (
    <PortalLayout user={user}>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold">Hola, {client.contact_name || client.name}!</h1>
          <p className="text-zinc-400">Bienvenido a tu portal de cliente</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<Clock size={20} />}
            label="Pendientes"
            value={pendingCount}
            color="yellow"
          />
          <StatCard
            icon={<AlertCircle size={20} />}
            label="En Progreso"
            value={inProgressCount}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle size={20} />}
            label="Completados"
            value={completedCount}
            color="green"
          />
        </div>

        {/* Projects */}
        {projects && projects.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Tus Proyectos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.map(project => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                  >
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                    {project.production_url && (
                      <a
                        href={project.production_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-500 hover:text-orange-400"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Requests */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Requests Recientes</CardTitle>
              <CardDescription>Tus ultimas solicitudes</CardDescription>
            </div>
            <Link href="/portal/requests/new">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus size={16} className="mr-2" />
                Nuevo Request
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!requests || requests.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">
                No tienes requests aun
              </p>
            ) : (
              <div className="space-y-3">
                {requests.map(request => (
                  <Link
                    key={request.id}
                    href={`/portal/requests/${request.id}`}
                    className="block p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-sm">
                            #{request.request_number}
                          </span>
                          <span className="font-medium">{request.title}</span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {(request.projects as unknown as { name: string } | null)?.name} • {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  )
}

function PortalLayout({ user, children }: { user: { email?: string }; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/portal/dashboard" className="text-xl font-bold text-orange-500">
            FoxLabs
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user.email}</span>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut size={16} />
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 py-8">
        {children}
      </main>
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
  value: number
  color: 'yellow' | 'blue' | 'green'
}) {
  const colors = {
    yellow: 'text-yellow-500 bg-yellow-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    green: 'text-green-500 bg-green-500/10'
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

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { class: string; label: string }> = {
    inbox: { class: 'bg-zinc-500/20 text-zinc-400', label: 'Recibido' },
    planning: { class: 'bg-blue-500/20 text-blue-400', label: 'Planificando' },
    approved: { class: 'bg-purple-500/20 text-purple-400', label: 'Aprobado' },
    queued: { class: 'bg-yellow-500/20 text-yellow-400', label: 'En Cola' },
    in_progress: { class: 'bg-orange-500/20 text-orange-400', label: 'En Progreso' },
    deploying: { class: 'bg-cyan-500/20 text-cyan-400 animate-pulse', label: 'Publicando...' },
    review: { class: 'bg-cyan-500/20 text-cyan-400', label: 'En Revision' },
    deployed: { class: 'bg-pink-500/20 text-pink-400', label: 'Desplegado' },
    completed: { class: 'bg-green-500/20 text-green-400', label: 'Completado' }
  }

  const variant = variants[status] || { class: 'bg-zinc-700', label: status }

  return (
    <span className={`text-xs px-2 py-1 rounded ${variant.class}`}>
      {variant.label}
    </span>
  )
}
