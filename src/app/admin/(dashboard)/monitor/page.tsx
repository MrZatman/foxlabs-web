'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  GitCommit,
  Rocket,
  Play,
  Pause,
  Filter,
  Cpu,
  Server
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ErrorPanel } from '@/components/monitor/ErrorPanel'
import { SystemHealth } from '@/components/monitor/SystemHealth'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ExecutionEvent {
  id: string
  request_id: string | null
  task_id: string | null
  event_type: string
  status: 'success' | 'failed' | 'warning' | 'info'
  message: string
  metadata: Record<string, unknown>
  created_at: string
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const eventIcons: Record<string, React.ElementType> = {
  execution_started: Play,
  execution_completed: CheckCircle,
  execution_failed: XCircle,
  execution_paused: Pause,
  task_started: Play,
  task_completed: CheckCircle,
  task_failed: XCircle,
  claude_started: Cpu,
  claude_timeout: Clock,
  git_commit: GitCommit,
  git_push: GitCommit,
  git_push_failed: XCircle,
  vercel_building: Loader2,
  vercel_ready: Rocket,
  vercel_failed: XCircle,
  queue_processing: Server
}

const eventStatusColors: Record<string, string> = {
  success: 'text-green-400',
  failed: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400'
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MonitorPage() {
  const [events, setEvents] = useState<ExecutionEvent[]>([])
  const [eventCounts, setEventCounts] = useState({ success: 0, failed: 0, warning: 0, info: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadEvents()

    // Subscribe to realtime events
    const channel = supabase
      .channel('monitor_events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'execution_events' },
        (payload) => {
          const newEvent = payload.new as ExecutionEvent
          setEvents(prev => [newEvent, ...prev].slice(0, 100))
          setEventCounts(prev => ({
            ...prev,
            [newEvent.status]: prev[newEvent.status as keyof typeof prev] + 1
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      // Get recent events
      const { data: recentEvents } = await supabase
        .from('execution_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (recentEvents) {
        setEvents(recentEvents)
      }

      // Get counts from last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: counts } = await supabase
        .from('execution_events')
        .select('status')
        .gte('created_at', yesterday)

      if (counts) {
        const countMap = { success: 0, failed: 0, warning: 0, info: 0 }
        counts.forEach(e => {
          if (e.status in countMap) {
            countMap[e.status as keyof typeof countMap]++
          }
        })
        setEventCounts(countMap)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async (requestId: string, eventType: string) => {
    // Call API to retry
    try {
      await fetch('/api/admin/monitor/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, eventType })
      })
      loadEvents()
    } catch (error) {
      console.error('Retry failed:', error)
    }
  }

  const handleCancel = async (requestId: string) => {
    // Update request status to cancelled
    try {
      await supabase
        .from('requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
      loadEvents()
    } catch (error) {
      console.error('Cancel failed:', error)
    }
  }

  const filteredEvents = statusFilter
    ? events.filter(e => e.status === statusFilter)
    : events

  const errorEvents = events.filter(e => e.status === 'failed')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitor de Ejecucion</h1>
          <p className="text-muted-foreground">Eventos en tiempo real del sistema</p>
        </div>
        <Button variant="outline" onClick={loadEvents}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* System Health */}
      <SystemHealth autoRefresh={true} refreshIntervalMs={30000} />

      {/* Event Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'failed' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'failed' ? null : 'failed')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{eventCounts.failed}</p>
              <p className="text-sm text-muted-foreground">Errores (24h)</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'warning' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'warning' ? null : 'warning')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{eventCounts.warning}</p>
              <p className="text-sm text-muted-foreground">Warnings (24h)</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'success' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'success' ? null : 'success')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{eventCounts.success}</p>
              <p className="text-sm text-muted-foreground">OK (24h)</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${statusFilter === 'info' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'info' ? null : 'info')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{eventCounts.info}</p>
              <p className="text-sm text-muted-foreground">Info (24h)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Panel */}
      {errorEvents.length > 0 && (
        <ErrorPanel
          errors={errorEvents}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      )}

      {/* Event Timeline */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Timeline de Eventos</CardTitle>
          {statusFilter && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter(null)}>
              <Filter className="mr-2 h-4 w-4" />
              Limpiar filtro
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No hay eventos registrados</p>
                <p className="text-sm">Los eventos apareceran aqui cuando se ejecuten requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map((event) => {
                  const Icon = eventIcons[event.event_type] || Activity
                  const statusColor = eventStatusColors[event.status] || 'text-gray-400'

                  return (
                    <div
                      key={event.id}
                      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                        event.status === 'failed' ? 'bg-red-500/5 border border-red-500/20' : ''
                      }`}
                    >
                      <div className={`mt-0.5 ${statusColor}`}>
                        <Icon className={`h-4 w-4 ${event.event_type === 'vercel_building' ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleTimeString('es-MX')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {event.event_type}
                          </Badge>
                          {event.request_id && (
                            <a
                              href={`/admin/requests/${event.request_id}`}
                              className="text-xs text-blue-400 hover:underline"
                            >
                              Ver request
                            </a>
                          )}
                        </div>
                        <p className="text-sm mt-1">{event.message}</p>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <pre className="text-xs text-muted-foreground mt-1 overflow-hidden text-ellipsis">
                            {JSON.stringify(event.metadata, null, 0).slice(0, 100)}
                          </pre>
                        )}
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
