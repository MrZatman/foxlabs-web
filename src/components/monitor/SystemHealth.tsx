'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Database,
  MessageSquare,
  GitBranch,
  Cloud,
  Server,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'down' | 'checking'
  lastCheck?: string
  details?: string
}

interface SystemHealthProps {
  autoRefresh?: boolean
  refreshIntervalMs?: number
}

export function SystemHealth({ autoRefresh = true, refreshIntervalMs = 30000 }: SystemHealthProps) {
  const [health, setHealth] = useState<HealthStatus[]>([
    { service: 'Supabase', status: 'checking' },
    { service: 'Queue', status: 'checking' },
    { service: 'Orchestrator', status: 'checking' }
  ])
  const [isChecking, setIsChecking] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    checkHealth()

    if (autoRefresh) {
      const interval = setInterval(checkHealth, refreshIntervalMs)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshIntervalMs])

  const checkHealth = async () => {
    setIsChecking(true)
    const results: HealthStatus[] = []
    const now = new Date().toISOString()

    // Check Supabase
    try {
      const supabase = createClient()
      const { error } = await supabase.from('clients').select('id').limit(1)
      results.push({
        service: 'Supabase',
        status: error ? 'degraded' : 'healthy',
        lastCheck: now,
        details: error?.message
      })
    } catch (err: unknown) {
      results.push({
        service: 'Supabase',
        status: 'down',
        lastCheck: now,
        details: err instanceof Error ? err.message : 'Connection failed'
      })
    }

    // Check Queue (from execution_queue table)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('execution_queue')
        .select('status')
        .in('status', ['pending', 'running'])
        .limit(10)

      if (error) {
        results.push({ service: 'Queue', status: 'degraded', lastCheck: now, details: error.message })
      } else {
        const pending = data?.filter(d => d.status === 'pending').length || 0
        const running = data?.filter(d => d.status === 'running').length || 0
        results.push({
          service: 'Queue',
          status: 'healthy',
          lastCheck: now,
          details: `${pending} pendientes, ${running} ejecutando`
        })
      }
    } catch {
      results.push({ service: 'Queue', status: 'down', lastCheck: now })
    }

    // Check Orchestrator (based on recent events)
    try {
      const supabase = createClient()
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('execution_events')
        .select('id')
        .gte('created_at', fiveMinutesAgo)
        .limit(1)

      if (error) {
        results.push({ service: 'Orchestrator', status: 'degraded', lastCheck: now })
      } else if (data && data.length > 0) {
        results.push({ service: 'Orchestrator', status: 'healthy', lastCheck: now, details: 'Activo' })
      } else {
        results.push({ service: 'Orchestrator', status: 'degraded', lastCheck: now, details: 'Sin actividad reciente' })
      }
    } catch {
      results.push({ service: 'Orchestrator', status: 'down', lastCheck: now })
    }

    setHealth(results)
    setLastRefresh(new Date())
    setIsChecking(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    }
  }

  const serviceIcons: Record<string, React.ElementType> = {
    'Supabase': Database,
    'Queue': Server,
    'Orchestrator': Cloud
  }

  const healthyCount = health.filter(h => h.status === 'healthy').length
  const totalCount = health.length
  const allHealthy = healthyCount === totalCount
  const hasDown = health.some(h => h.status === 'down')

  return (
    <Card className={allHealthy ? 'border-green-500/30' : hasDown ? 'border-red-500/30' : 'border-yellow-500/30'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${allHealthy ? 'bg-green-500' : hasDown ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <CardTitle className="text-lg">System Health</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{healthyCount}/{totalCount} OK</Badge>
            <Button variant="ghost" size="sm" onClick={checkHealth} disabled={isChecking}>
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {health.map((item) => {
            const Icon = serviceIcons[item.service] || Server
            return (
              <div key={item.service} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">{item.service}</span>
                    {item.details && (
                      <p className="text-xs text-muted-foreground">{item.details}</p>
                    )}
                  </div>
                </div>
                {getStatusIcon(item.status)}
              </div>
            )
          })}
        </div>
        {lastRefresh && (
          <p className="text-xs text-muted-foreground mt-3 text-right">
            Ultimo check: {lastRefresh.toLocaleTimeString('es-MX')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
