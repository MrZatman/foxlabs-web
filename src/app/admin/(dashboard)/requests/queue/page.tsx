import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ArrowUp, ArrowDown, X, PlayCircle, Pause } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default async function QueuePage() {
  const supabase = await createClient()

  // Get queued requests
  const { data: queue } = await supabase
    .from('execution_queue')
    .select(`
      *,
      requests(id, request_number, title, estimated_hours, projects(name))
    `)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  // Get current execution
  const { data: currentExecution } = await supabase
    .from('execution_queue')
    .select(`
      *,
      requests(id, request_number, title, projects(name))
    `)
    .eq('status', 'running')
    .single()

  // Get current task if executing
  let currentTask = null
  if (currentExecution) {
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('request_id', (currentExecution.requests as { id: string })?.id)
      .eq('status', 'in_progress')
      .single()
    currentTask = task
  }

  // Calculate total estimated time
  const totalHours = queue?.reduce((sum, item) => {
    return sum + ((item.requests as { estimated_hours: number } | null)?.estimated_hours || 0)
  }, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Cola de Ejecucion</h1>
          <p className="text-zinc-400">{queue?.length || 0} requests en cola</p>
        </div>
      </div>

      {/* System Status */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              FoxOrchestrator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Estado</span>
              <Badge className="bg-green-500/20 text-green-400">Online</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Tiempo Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalHours}h</div>
            <div className="text-sm text-zinc-400">Para completar la cola</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Execution */}
      {currentExecution && (
        <Card className="bg-zinc-900 border-zinc-800 border-orange-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <PlayCircle size={18} className="animate-pulse" />
              Ejecutando Ahora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href={`/admin/requests/${(currentExecution.requests as { id: string })?.id}`}
                  className="font-medium hover:text-orange-500"
                >
                  #{(currentExecution.requests as { request_number: number })?.request_number} {(currentExecution.requests as { title: string })?.title}
                </Link>
                <div className="text-sm text-zinc-400">
                  {((currentExecution.requests as { projects: { name: string } })?.projects as unknown as { name: string })?.name}
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Pause size={16} className="mr-2" />
                Pausar
              </Button>
            </div>

            {currentTask && (
              <div className="p-3 rounded-lg bg-zinc-800">
                <div className="text-sm text-zinc-400 mb-1">Tarea actual</div>
                <div className="font-medium">{currentTask.title}</div>
                {currentTask.progress !== undefined && (
                  <Progress value={currentTask.progress} className="mt-2 h-1" />
                )}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span>Iniciado: {new Date(currentExecution.started_at || currentExecution.created_at).toLocaleTimeString('es-MX')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Cola</CardTitle>
        </CardHeader>
        <CardContent>
          {!queue || queue.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No hay requests en cola</p>
          ) : (
            <div className="space-y-3">
              {queue.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/requests/${(item.requests as { id: string })?.id}`}
                      className="font-medium hover:text-orange-500"
                    >
                      #{(item.requests as { request_number: number })?.request_number} {(item.requests as { title: string })?.title}
                    </Link>
                    <div className="text-sm text-zinc-400">
                      {((item.requests as { projects: { name: string } })?.projects as unknown as { name: string })?.name}
                      {(item.requests as { estimated_hours: number })?.estimated_hours && (
                        <span className="ml-2">• {(item.requests as { estimated_hours: number }).estimated_hours}h estimadas</span>
                      )}
                    </div>
                  </div>

                  <Badge className={`
                    ${item.priority >= 3 ? 'bg-red-500/20 text-red-400' :
                      item.priority >= 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-zinc-500/20 text-zinc-400'}
                  `}>
                    P{item.priority}
                  </Badge>

                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" disabled={index === 0}>
                      <ArrowUp size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={index === queue.length - 1}>
                      <ArrowDown size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300">
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
