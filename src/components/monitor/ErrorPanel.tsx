'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertTriangle,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2
} from 'lucide-react'

interface ErrorEvent {
  id: string
  request_id: string | null
  task_id: string | null
  event_type: string
  message: string
  metadata: Record<string, unknown>
  created_at: string
}

interface ErrorPanelProps {
  errors: ErrorEvent[]
  onRetry?: (requestId: string, eventType: string) => Promise<void>
  onCancel?: (requestId: string) => Promise<void>
}

export function ErrorPanel({ errors, onRetry, onCancel }: ErrorPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)

  if (errors.length === 0) {
    return null
  }

  const handleRetry = async (event: ErrorEvent) => {
    if (!onRetry || !event.request_id) return
    setRetrying(event.id)
    try {
      await onRetry(event.request_id, event.event_type)
    } finally {
      setRetrying(null)
    }
  }

  const handleCancel = async (event: ErrorEvent) => {
    if (!onCancel || !event.request_id) return
    setCancelling(event.id)
    try {
      await onCancel(event.request_id)
    } finally {
      setCancelling(null)
    }
  }

  const canRetry = (eventType: string) => {
    return ['git_push_failed', 'task_failed', 'vercel_failed', 'execution_failed'].includes(eventType)
  }

  return (
    <Card className="border-red-500/50 bg-red-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <CardTitle className="text-lg text-red-500">
            Errores ({errors.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-3">
            {errors.map((error) => {
              const isExpanded = expandedId === error.id
              const isRetrying = retrying === error.id
              const isCancelling = cancelling === error.id

              return (
                <div
                  key={error.id}
                  className="bg-background rounded-lg border border-red-500/30 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="destructive" className="text-xs">
                          {error.event_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(error.created_at).toLocaleTimeString('es-MX')}
                        </span>
                      </div>
                      <p className="text-sm mt-1 font-medium">{error.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : error.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 space-y-3">
                      {error.metadata && Object.keys(error.metadata).length > 0 && (
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(error.metadata, null, 2)}
                        </pre>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {canRetry(error.event_type) && error.request_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(error)}
                            disabled={isRetrying || isCancelling}
                          >
                            {isRetrying ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Reintentar
                          </Button>
                        )}

                        {error.request_id && (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancel(error)}
                              disabled={isRetrying || isCancelling}
                            >
                              {isCancelling ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                              )}
                              Cancelar
                            </Button>

                            <Button size="sm" variant="ghost" asChild>
                              <a href={`/admin/requests/${error.request_id}`}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver Request
                              </a>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
