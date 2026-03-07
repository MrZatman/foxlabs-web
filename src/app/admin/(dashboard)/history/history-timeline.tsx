'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  GitCommit,
  Rocket,
  MessageSquare,
  FileText
} from 'lucide-react'

interface Request {
  id: string
  request_number: number
  title: string
  status: string
  created_at: string
  projects?: { name: string }
}

interface TimelineEvent {
  id: string
  type: 'activity' | 'execution'
  event_type?: string
  message: string
  created_at: string
  request_id?: string
  request_number?: number
  request_title?: string
  status?: string
}

const eventIcons: Record<string, React.ElementType> = {
  execution_started: Play,
  execution_completed: CheckCircle,
  execution_failed: XCircle,
  execution_paused: Pause,
  task_started: Play,
  task_completed: CheckCircle,
  task_failed: XCircle,
  git_commit: GitCommit,
  git_push: GitCommit,
  vercel_building: Rocket,
  vercel_ready: Rocket,
  question_asked: MessageSquare,
  activity: FileText
}

const eventColors: Record<string, string> = {
  execution_completed: 'text-green-400',
  task_completed: 'text-green-400',
  vercel_ready: 'text-green-400',
  execution_failed: 'text-red-400',
  task_failed: 'text-red-400',
  execution_started: 'text-blue-400',
  task_started: 'text-blue-400',
  git_commit: 'text-purple-400',
  git_push: 'text-purple-400',
  vercel_building: 'text-orange-400'
}

export function HistoryTimeline({ requests }: { requests: Request[] }) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<'time' | 'request'>('time')

  const supabase = createClient()

  useEffect(() => {
    loadAllEvents()
  }, [requests])

  const loadAllEvents = async () => {
    if (requests.length === 0) {
      setEvents([])
      setLoading(false)
      return
    }

    setLoading(true)
    const requestIds = requests.map(r => r.id)
    const requestMap = new Map(requests.map(r => [r.id, r]))

    try {
      // Get activity logs
      const { data: activity } = await supabase
        .from('activity_log')
        .select('*')
        .eq('resource_type', 'request')
        .in('resource_id', requestIds)
        .order('created_at', { ascending: false })
        .limit(200)

      // Get execution events
      const { data: execEvents } = await supabase
        .from('execution_events')
        .select('*')
        .in('request_id', requestIds)
        .order('created_at', { ascending: false })
        .limit(200)

      // Merge events
      const merged: TimelineEvent[] = [
        ...(activity?.map(a => {
          const req = requestMap.get(a.resource_id)
          return {
            id: a.id,
            type: 'activity' as const,
            event_type: 'activity',
            message: a.message,
            created_at: a.created_at,
            request_id: a.resource_id,
            request_number: req?.request_number,
            request_title: req?.title
          }
        }) || []),
        ...(execEvents?.map(e => {
          const req = requestMap.get(e.request_id)
          return {
            id: e.id,
            type: 'execution' as const,
            event_type: e.event_type,
            message: e.message,
            created_at: e.created_at,
            request_id: e.request_id,
            request_number: req?.request_number,
            request_title: req?.title,
            status: e.status
          }
        }) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setEvents(merged.slice(0, 300))
    } catch (error) {
      console.error('Error loading timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group by date
  const groupedByDate: Record<string, TimelineEvent[]> = {}
  events.forEach(event => {
    const date = new Date(event.created_at).toLocaleDateString('es-MX')
    if (!groupedByDate[date]) {
      groupedByDate[date] = []
    }
    groupedByDate[date].push(event)
  })

  // Group by request
  const groupedByRequest: Record<string, TimelineEvent[]> = {}
  events.forEach(event => {
    const key = event.request_id || 'unknown'
    if (!groupedByRequest[key]) {
      groupedByRequest[key] = []
    }
    groupedByRequest[key].push(event)
  })

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-12 text-center text-zinc-500">
          Cargando timeline...
        </CardContent>
      </Card>
    )
  }

  if (events.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-12 text-center text-zinc-500">
          No hay eventos en el periodo seleccionado
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Group toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setGroupBy('time')}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            groupBy === 'time'
              ? 'bg-zinc-700 text-white'
              : 'bg-zinc-800/50 text-zinc-400'
          }`}
        >
          Por Fecha
        </button>
        <button
          onClick={() => setGroupBy('request')}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            groupBy === 'request'
              ? 'bg-zinc-700 text-white'
              : 'bg-zinc-800/50 text-zinc-400'
          }`}
        >
          Por Request
        </button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <ScrollArea className="h-[600px]">
            {groupBy === 'time' ? (
              <div className="space-y-6">
                {Object.entries(groupedByDate).map(([date, dateEvents]) => (
                  <div key={date}>
                    <div className="sticky top-0 bg-zinc-900 py-2 mb-3">
                      <Badge variant="secondary">{date}</Badge>
                      <span className="text-zinc-500 text-sm ml-2">
                        {dateEvents.length} eventos
                      </span>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-zinc-800">
                      {dateEvents.map(event => (
                        <EventItem key={event.id} event={event} showRequest />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByRequest).map(([requestId, reqEvents]) => {
                  const firstEvent = reqEvents[0]
                  return (
                    <div key={requestId}>
                      <div className="sticky top-0 bg-zinc-900 py-2 mb-3 flex items-center gap-2">
                        <Link
                          href={`/admin/requests/${requestId}`}
                          className="hover:text-orange-400"
                        >
                          #{firstEvent.request_number}
                        </Link>
                        <span className="text-zinc-400 truncate max-w-[300px]">
                          {firstEvent.request_title}
                        </span>
                        <span className="text-zinc-500 text-sm ml-auto">
                          {reqEvents.length} eventos
                        </span>
                      </div>
                      <div className="space-y-2 pl-4 border-l-2 border-zinc-800">
                        {reqEvents.map(event => (
                          <EventItem key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function EventItem({
  event,
  showRequest = false
}: {
  event: TimelineEvent
  showRequest?: boolean
}) {
  const Icon = eventIcons[event.event_type || 'activity'] || FileText
  const colorClass = eventColors[event.event_type || ''] || 'text-zinc-400'

  return (
    <div className="flex gap-3 py-2">
      <div className={`mt-0.5 ${colorClass}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {showRequest && event.request_number && (
            <Link
              href={`/admin/requests/${event.request_id}`}
              className="text-xs text-zinc-500 hover:text-orange-400"
            >
              #{event.request_number}
            </Link>
          )}
          <span className="text-sm">{event.message}</span>
        </div>
        <div className="text-xs text-zinc-600 mt-0.5">
          {new Date(event.created_at).toLocaleTimeString('es-MX')}
        </div>
      </div>
    </div>
  )
}
