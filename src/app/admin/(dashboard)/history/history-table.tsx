'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Request {
  id: string
  request_number: number
  title: string
  status: string
  priority: string
  type: string
  created_at: string
  completed_at?: string
  estimated_hours?: number
  actual_hours?: number
  projects?: {
    name: string
    clients?: { name: string }
  }
  tasks?: Array<{ id: string; title: string; status: string }>
}

const statusColors: Record<string, string> = {
  inbox: 'bg-zinc-500/20 text-zinc-400',
  planning: 'bg-blue-500/20 text-blue-400',
  pending_approval: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-purple-500/20 text-purple-400',
  queued: 'bg-indigo-500/20 text-indigo-400',
  in_progress: 'bg-orange-500/20 text-orange-400',
  pending_review: 'bg-cyan-500/20 text-cyan-400',
  pending_deploy: 'bg-pink-500/20 text-pink-400',
  completed: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-red-500/20 text-red-400'
}

const priorityColors: Record<string, string> = {
  low: 'text-zinc-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400'
}

export function HistoryTable({ requests }: { requests: Request[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<Array<{
    id: string
    message: string
    created_at: string
    type?: string
  }>>([])
  const [loadingTimeline, setLoadingTimeline] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (expandedId) {
      loadTimeline(expandedId)
    }
  }, [expandedId])

  const loadTimeline = async (requestId: string) => {
    setLoadingTimeline(true)
    try {
      // Get activity log
      const { data: activity } = await supabase
        .from('activity_log')
        .select('*')
        .eq('resource_type', 'request')
        .eq('resource_id', requestId)
        .order('created_at', { ascending: false })
        .limit(50)

      // Get execution events
      const { data: events } = await supabase
        .from('execution_events')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false })
        .limit(50)

      // Merge and sort
      const merged = [
        ...(activity?.map(a => ({
          id: a.id,
          message: a.message,
          created_at: a.created_at,
          type: 'activity'
        })) || []),
        ...(events?.map(e => ({
          id: e.id,
          message: e.message,
          created_at: e.created_at,
          type: e.event_type
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setTimeline(merged.slice(0, 30))
    } catch (error) {
      console.error('Error loading timeline:', error)
    } finally {
      setLoadingTimeline(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (requests.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-12 text-center text-zinc-500">
          No hay requests en el periodo seleccionado
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-4 text-zinc-400 font-medium w-10"></th>
                <th className="text-left p-4 text-zinc-400 font-medium">#</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Titulo</th>
                <th className="text-left p-4 text-zinc-400 font-medium hidden md:table-cell">Cliente</th>
                <th className="text-left p-4 text-zinc-400 font-medium hidden lg:table-cell">Proyecto</th>
                <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
                <th className="text-left p-4 text-zinc-400 font-medium hidden sm:table-cell">Prioridad</th>
                <th className="text-left p-4 text-zinc-400 font-medium hidden lg:table-cell">Creado</th>
                <th className="text-left p-4 text-zinc-400 font-medium hidden xl:table-cell">Tiempo</th>
                <th className="text-left p-4 text-zinc-400 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const isExpanded = expandedId === request.id
                const completedTasks = request.tasks?.filter(t => t.status === 'done').length || 0
                const totalTasks = request.tasks?.length || 0

                return (
                  <>
                    <tr
                      key={request.id}
                      className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer ${
                        isExpanded ? 'bg-zinc-800/50' : ''
                      }`}
                      onClick={() => toggleExpand(request.id)}
                    >
                      <td className="p-4">
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-zinc-500" />
                        ) : (
                          <ChevronDown size={16} className="text-zinc-500" />
                        )}
                      </td>
                      <td className="p-4 text-zinc-500">#{request.request_number}</td>
                      <td className="p-4">
                        <div className="font-medium truncate max-w-[200px] lg:max-w-[300px]">
                          {request.title}
                        </div>
                        {totalTasks > 0 && (
                          <div className="text-xs text-zinc-500 mt-1">
                            {completedTasks}/{totalTasks} tareas
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-zinc-400 hidden md:table-cell">
                        {request.projects?.clients?.name || '-'}
                      </td>
                      <td className="p-4 text-zinc-400 hidden lg:table-cell">
                        {request.projects?.name || '-'}
                      </td>
                      <td className="p-4">
                        <Badge className={statusColors[request.status] || 'bg-zinc-700'}>
                          {request.status}
                        </Badge>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className={priorityColors[request.priority] || 'text-zinc-400'}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400 hidden lg:table-cell">
                        {new Date(request.created_at).toLocaleDateString('es-MX')}
                      </td>
                      <td className="p-4 text-zinc-400 hidden xl:table-cell">
                        {request.actual_hours || request.estimated_hours
                          ? `${request.actual_hours || request.estimated_hours}h`
                          : '-'}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/requests/${request.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink size={14} />
                          </Button>
                        </Link>
                      </td>
                    </tr>

                    {/* Expanded Timeline */}
                    {isExpanded && (
                      <tr key={`${request.id}-timeline`}>
                        <td colSpan={10} className="p-0">
                          <div className="bg-zinc-950 p-4 border-b border-zinc-800">
                            <h4 className="text-sm font-medium mb-3">Timeline</h4>
                            {loadingTimeline ? (
                              <div className="text-zinc-500 text-sm">Cargando...</div>
                            ) : timeline.length === 0 ? (
                              <div className="text-zinc-500 text-sm">Sin eventos registrados</div>
                            ) : (
                              <ScrollArea className="h-[200px]">
                                <div className="space-y-2">
                                  {timeline.map((item) => (
                                    <div key={item.id} className="flex gap-3 text-sm">
                                      <div className="w-2 h-2 mt-1.5 rounded-full bg-zinc-600 flex-shrink-0" />
                                      <div className="flex-1">
                                        <span className="text-zinc-300">{item.message}</span>
                                        <span className="text-zinc-600 ml-2">
                                          {new Date(item.created_at).toLocaleString('es-MX')}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
