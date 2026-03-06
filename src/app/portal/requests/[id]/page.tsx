import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  // Get request with project and tasks
  const { data: request, error } = await supabase
    .from('requests')
    .select(`
      *,
      projects(
        name,
        production_url,
        client_id,
        clients(email)
      ),
      tasks(
        id,
        title,
        status,
        order_index
      )
    `)
    .eq('id', id)
    .single()

  if (error || !request) {
    notFound()
  }

  // Verify ownership
  const clientEmail = (request.projects as { clients: { email: string } | null })?.clients?.email
  if (clientEmail !== user.email) {
    notFound()
  }

  // Calculate progress
  const tasks = (request.tasks as { status: string }[]) || []
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  const statusConfig = getStatusConfig(request.status)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/portal/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} />
            Volver al Dashboard
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-zinc-500">#{request.request_number}</span>
            <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
          </div>
          <h1 className="text-2xl font-bold">{request.title}</h1>
          <p className="text-zinc-400 mt-1">
            {(request.projects as unknown as { name: string } | null)?.name} • {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Progress */}
        {tasks.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Progreso</span>
                <span className="text-sm">{completedTasks}/{tasks.length} tareas</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Status Timeline */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <TimelineItem
                icon={<CheckCircle size={18} />}
                title="Recibido"
                date={request.created_at}
                active={true}
              />
              <TimelineItem
                icon={<Clock size={18} />}
                title="En Progreso"
                date={request.started_at}
                active={['in_progress', 'preview_ready', 'completed'].includes(request.status)}
              />
              <TimelineItem
                icon={<AlertCircle size={18} />}
                title="Preview Listo"
                active={['preview_ready', 'completed'].includes(request.status)}
              />
              <TimelineItem
                icon={<CheckCircle size={18} />}
                title="Completado"
                date={request.completed_at}
                active={request.status === 'completed'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Descripcion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 whitespace-pre-wrap">{request.description}</p>
          </CardContent>
        </Card>

        {/* Preview URL */}
        {request.preview_url && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-zinc-500">Preview disponible</div>
                  <div className="font-medium">{request.preview_url}</div>
                </div>
                <a
                  href={request.preview_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-zinc-500">Tipo</div>
              <div className="font-medium capitalize">{request.type}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-zinc-500">Prioridad</div>
              <div className="font-medium capitalize">{request.priority}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TimelineItem({
  icon,
  title,
  date,
  active
}: {
  icon: React.ReactNode
  title: string
  date?: string
  active: boolean
}) {
  return (
    <div className={`flex items-center gap-3 ${active ? 'text-white' : 'text-zinc-600'}`}>
      <div className={`p-1 rounded-full ${active ? 'text-orange-500' : ''}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        {date && (
          <div className="text-xs text-zinc-500">
            {new Date(date).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

function getStatusConfig(status: string) {
  const configs: Record<string, { class: string; label: string }> = {
    pending: { class: 'bg-yellow-500/20 text-yellow-400', label: 'Pendiente' },
    planning: { class: 'bg-blue-500/20 text-blue-400', label: 'Planificando' },
    approved: { class: 'bg-purple-500/20 text-purple-400', label: 'Aprobado' },
    in_progress: { class: 'bg-orange-500/20 text-orange-400', label: 'En Progreso' },
    deploying: { class: 'bg-cyan-500/20 text-cyan-400 animate-pulse', label: 'Publicando...' },
    preview_ready: { class: 'bg-cyan-500/20 text-cyan-400', label: 'Preview Listo' },
    completed: { class: 'bg-green-500/20 text-green-400', label: 'Completado' },
    failed: { class: 'bg-red-500/20 text-red-400', label: 'Error' }
  }
  return configs[status] || { class: 'bg-zinc-700', label: status }
}
