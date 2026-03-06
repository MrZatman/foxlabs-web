'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Bot, Clock, CheckCircle } from 'lucide-react'

interface Request {
  id: string
  request_number: number
  title: string
  status: string
  priority: string
  estimated_hours?: number
  projects?: { name: string; slug: string } | null
  current_task?: string
  updated_at: string
}

interface Column {
  id: string
  label: string
  color: string
}

interface Props {
  initialRequests: Request[]
  columns: Column[]
  priorityColors: Record<string, string>
}

// Status messages for user feedback
const statusMessages: Record<string, { icon: React.ReactNode; message: string }> = {
  inbox: { icon: <Clock size={12} />, message: 'Esperando procesamiento' },
  planning: { icon: <Loader2 size={12} className="animate-spin" />, message: 'Claude esta planificando...' },
  pending_approval: { icon: <Clock size={12} />, message: 'Esperando tu aprobacion en Telegram' },
  approved: { icon: <CheckCircle size={12} />, message: 'Aprobado, en cola de ejecucion' },
  queued: { icon: <Clock size={12} />, message: 'En cola, esperando turno' },
  in_progress: { icon: <Bot size={12} className="animate-pulse" />, message: 'Claude ejecutando tareas...' },
  pending_review: { icon: <Clock size={12} />, message: 'Esperando revision' },
  pending_deploy: { icon: <Loader2 size={12} className="animate-spin" />, message: 'Desplegando en Vercel...' },
  completed: { icon: <CheckCircle size={12} />, message: 'Completado' },
  cancelled: { icon: null, message: 'Cancelado' },
}

export function KanbanBoard({ initialRequests, columns, priorityColors }: Props) {
  const [requests, setRequests] = useState<Request[]>(initialRequests)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests'
        },
        async (payload) => {
          console.log('Realtime update:', payload)

          if (payload.eventType === 'INSERT') {
            // Fetch full request with project relation
            const { data } = await supabase
              .from('requests')
              .select('*, projects(name, slug)')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setRequests(prev => [data, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev =>
              prev.map(r =>
                r.id === payload.new.id
                  ? { ...r, ...payload.new }
                  : r
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(r => r.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Group by status
  const requestsByStatus: Record<string, Request[]> = {}
  columns.forEach(col => {
    requestsByStatus[col.id] = requests.filter(r => r.status === col.id)
  })

  return (
    <div className="space-y-2">
      {/* Connection indicator */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
        {isConnected ? 'Realtime conectado' : 'Conectando...'}
      </div>

      {/* Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => (
            <div key={column.id} className="w-72 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <span className="font-medium">{column.label}</span>
                <Badge variant="secondary" className="ml-auto">
                  {requestsByStatus[column.id]?.length || 0}
                </Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-3 pr-2">
                  {requestsByStatus[column.id]?.map((request) => (
                    <Link key={request.id} href={`/admin/requests/${request.id}`}>
                      <Card className={`bg-zinc-900 border-zinc-800 border-l-4 ${priorityColors[request.priority] || 'border-l-zinc-500'} hover:bg-zinc-800 cursor-pointer transition-all ${
                        request.status === 'in_progress' || request.status === 'planning' || request.status === 'pending_deploy'
                          ? 'ring-1 ring-orange-500/30'
                          : ''
                      }`}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm text-zinc-500">#{request.request_number}</div>
                              <div className="font-medium truncate">{request.title}</div>
                            </div>
                          </div>

                          {/* Status message */}
                          {statusMessages[request.status] && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                              {statusMessages[request.status].icon}
                              <span>{statusMessages[request.status].message}</span>
                            </div>
                          )}

                          {/* Current task if available */}
                          {request.current_task && (
                            <div className="mt-2 text-xs text-orange-400 truncate">
                              {request.current_task}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {request.projects?.name || 'Sin proyecto'}
                            </Badge>
                            {request.estimated_hours && (
                              <span className="text-xs text-zinc-500">
                                {request.estimated_hours}h
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {(!requestsByStatus[column.id] || requestsByStatus[column.id].length === 0) && (
                    <div className="p-4 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-lg">
                      Sin requests
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
