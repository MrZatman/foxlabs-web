import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  PlayCircle,
  Pause,
  Rocket,
  MessageSquare,
  Send,
  FileText,
  Image
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

const statusColors: Record<string, string> = {
  pending: 'bg-zinc-500/20 text-zinc-400',
  planning: 'bg-blue-500/20 text-blue-400',
  pending_approval: 'bg-purple-500/20 text-purple-400',
  queued: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-orange-500/20 text-orange-400',
  testing: 'bg-cyan-500/20 text-cyan-400',
  pending_deploy: 'bg-pink-500/20 text-pink-400',
  completed: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400'
}

export default async function RequestDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: request, error } = await supabase
    .from('requests')
    .select(`
      *,
      projects(id, name, slug, client_id),
      clients:projects(clients(name))
    `)
    .eq('id', id)
    .single()

  if (error || !request) {
    notFound()
  }

  // Get tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('request_id', id)
    .order('order', { ascending: true })

  // Get questions
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: false })

  // Get attachments
  const { data: attachments } = await supabase
    .from('request_attachments')
    .select('*')
    .eq('request_id', id)

  // Get screenshots
  const { data: screenshots } = await supabase
    .from('screenshots')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: false })

  // Get activity
  const { data: activity } = await supabase
    .from('activity_log')
    .select('*')
    .eq('resource_type', 'request')
    .eq('resource_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Calculate progress
  const completedTasks = tasks?.filter(t => t.status === 'done').length || 0
  const totalTasks = tasks?.length || 0
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  async function updateStatus(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const newStatus = formData.get('status') as string

    await supabase
      .from('requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    // Log activity
    await supabase.from('activity_log').insert({
      type: 'request',
      resource_type: 'request',
      resource_id: id,
      message: `Request #${request.request_number} cambiado a ${newStatus}`,
      actor: 'admin'
    })

    redirect(`/admin/requests/${id}`)
  }

  async function answerQuestion(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const questionId = formData.get('question_id') as string
    const answer = formData.get('answer') as string

    await supabase
      .from('questions')
      .update({
        answer,
        answered_at: new Date().toISOString()
      })
      .eq('id', questionId)

    redirect(`/admin/requests/${id}`)
  }

  const pendingQuestions = questions?.filter(q => !q.answer) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">#{request.request_number}</span>
            <h1 className="text-2xl font-bold">{request.title}</h1>
          </div>
          <p className="text-zinc-400">
            {(request.projects as { name: string } | null)?.name || 'Sin proyecto'}
          </p>
        </div>
        <Badge className={statusColors[request.status] || 'bg-zinc-700'}>
          {request.status}
        </Badge>
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Progreso</span>
              <span className="text-sm font-medium">{completedTasks}/{totalTasks} tareas</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Actions based on status */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {request.status === 'pending' && (
              <form action={updateStatus}>
                <input type="hidden" name="status" value="planning" />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <PlayCircle size={16} className="mr-2" />
                  Generar Plan
                </Button>
              </form>
            )}

            {request.status === 'pending_approval' && (
              <>
                <form action={updateStatus}>
                  <input type="hidden" name="status" value="queued" />
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle size={16} className="mr-2" />
                    Aprobar
                  </Button>
                </form>
                <form action={updateStatus}>
                  <input type="hidden" name="status" value="pending" />
                  <Button type="submit" variant="destructive">
                    <XCircle size={16} className="mr-2" />
                    Rechazar
                  </Button>
                </form>
              </>
            )}

            {request.status === 'in_progress' && (
              <form action={updateStatus}>
                <input type="hidden" name="status" value="queued" />
                <Button type="submit" variant="outline">
                  <Pause size={16} className="mr-2" />
                  Pausar
                </Button>
              </form>
            )}

            {request.status === 'pending_deploy' && (
              <form action={updateStatus}>
                <input type="hidden" name="status" value="completed" />
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <Rocket size={16} className="mr-2" />
                  Deploy a Produccion
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Descripcion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{request.description || 'Sin descripcion'}</p>

              {attachments && attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="text-sm text-zinc-400 mb-2">Archivos adjuntos</div>
                  <div className="space-y-2">
                    {attachments.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                      >
                        <FileText size={16} />
                        <span>{file.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          {tasks && tasks.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Plan de Tareas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.map((task, i) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        task.status === 'done' ? 'bg-green-500/10' :
                        task.status === 'in_progress' ? 'bg-orange-500/10' :
                        'bg-zinc-800/50'
                      }`}
                    >
                      <span className="text-zinc-500 w-6">{i + 1}.</span>
                      <span className={task.status === 'done' ? 'line-through text-zinc-500' : ''}>
                        {task.title}
                      </span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions */}
          {pendingQuestions.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400">
                  <MessageSquare size={18} />
                  Preguntas Pendientes ({pendingQuestions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingQuestions.map((q) => (
                  <form key={q.id} action={answerQuestion} className="p-4 rounded-lg bg-zinc-800">
                    <input type="hidden" name="question_id" value={q.id} />
                    <p className="mb-3">{q.question}</p>
                    <div className="flex gap-2">
                      <Textarea
                        name="answer"
                        placeholder="Tu respuesta..."
                        required
                        className="bg-zinc-900 border-zinc-700"
                      />
                      <Button type="submit" size="icon" className="flex-shrink-0">
                        <Send size={16} />
                      </Button>
                    </div>
                  </form>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Screenshots */}
          {screenshots && screenshots.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image size={18} />
                  Screenshots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {screenshots.map((ss) => (
                    <a
                      key={ss.id}
                      href={ss.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden bg-zinc-800 hover:opacity-80"
                    >
                      <img src={ss.url} alt={ss.label || 'Screenshot'} className="w-full" />
                      {ss.label && (
                        <div className="p-2 text-sm text-zinc-400">{ss.label}</div>
                      )}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-400">Tipo</span>
                <Badge variant="secondary">{request.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Prioridad</span>
                <Badge className={`
                  ${request.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                    request.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      request.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-zinc-500/20 text-zinc-400'}
                `}>
                  {request.priority}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Creado</span>
                <span className="text-sm">{new Date(request.created_at).toLocaleDateString('es-MX')}</span>
              </div>
              {request.estimated_hours && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Estimado</span>
                  <span className="text-sm">{request.estimated_hours}h</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {!activity || activity.length === 0 ? (
                  <p className="text-zinc-500 text-center py-4">Sin actividad</p>
                ) : (
                  <div className="space-y-3">
                    {activity.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-zinc-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm">{item.message}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(item.created_at).toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
