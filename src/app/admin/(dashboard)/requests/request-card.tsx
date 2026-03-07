'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Loader2,
  CheckCircle,
  Bot,
  AlertTriangle
} from 'lucide-react'

interface Request {
  id: string
  request_number: number
  title: string
  description?: string
  status: string
  priority: string
  estimated_hours?: number
  projects?: { name: string; slug: string } | null
  clients?: { name: string } | null
  current_task?: string
  updated_at: string
  created_at: string
  tasks_count?: number
}

interface RequestCardProps {
  request: Request
  priorityColors: Record<string, string>
}

// Status messages for user feedback
const statusMessages: Record<string, { icon: React.ReactNode; message: string }> = {
  inbox: { icon: <Clock size={12} />, message: 'Esperando' },
  planning: { icon: <Loader2 size={12} className="animate-spin" />, message: 'Planificando...' },
  pending_approval: { icon: <Clock size={12} />, message: 'Pendiente aprobacion' },
  approved: { icon: <CheckCircle size={12} />, message: 'Aprobado' },
  queued: { icon: <Clock size={12} />, message: 'En cola' },
  in_progress: { icon: <Bot size={12} className="animate-pulse" />, message: 'Ejecutando...' },
  pending_review: { icon: <Clock size={12} />, message: 'En review' },
  pending_deploy: { icon: <Loader2 size={12} className="animate-spin" />, message: 'Desplegando...' },
  completed: { icon: <CheckCircle size={12} />, message: 'Completado' },
  cancelled: { icon: null, message: 'Cancelado' },
}

// Calculate hours since last update
function getHoursSinceUpdate(updatedAt: string): number {
  const now = new Date()
  const updated = new Date(updatedAt)
  return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60))
}

// Get relative time string
function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'ahora'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

// Get stale status based on hours
function getStaleStatus(hours: number): 'normal' | 'warning' | 'critical' {
  if (hours >= 72) return 'critical'
  if (hours >= 24) return 'warning'
  return 'normal'
}

export function RequestCard({ request, priorityColors }: RequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hoursSinceUpdate = getHoursSinceUpdate(request.updated_at)
  const staleStatus = getStaleStatus(hoursSinceUpdate)
  const relativeTime = getRelativeTime(request.updated_at)

  // Determine border classes
  const priorityBorder = priorityColors[request.priority] || 'border-l-zinc-500'
  const staleBorder = staleStatus === 'critical'
    ? 'border-t-red-500 border-t-2'
    : staleStatus === 'warning'
      ? 'border-t-yellow-500 border-t-2'
      : ''

  // Active status ring
  const isActive = ['in_progress', 'planning', 'pending_deploy'].includes(request.status)
  const activeRing = isActive ? 'ring-1 ring-orange-500/30' : ''

  if (isExpanded) {
    return (
      <Card className={`bg-zinc-900 border-zinc-800 border-l-4 ${priorityBorder} ${staleBorder} ${activeRing}`}>
        <CardContent className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>#{request.request_number}</span>
                <span>{relativeTime}</span>
                {staleStatus !== 'normal' && (
                  <AlertTriangle size={12} className={staleStatus === 'critical' ? 'text-red-400' : 'text-yellow-400'} />
                )}
              </div>
              <div className="font-medium mt-1">{request.title}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp size={14} />
            </Button>
          </div>

          {/* Description */}
          {request.description && (
            <p className="text-sm text-zinc-400 line-clamp-3">
              {request.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary">
              {request.projects?.name || 'Sin proyecto'}
            </Badge>
            {request.clients?.name && (
              <Badge variant="outline" className="text-zinc-400">
                {request.clients.name}
              </Badge>
            )}
            {request.tasks_count !== undefined && request.tasks_count > 0 && (
              <span className="text-zinc-500">
                {request.tasks_count} tareas
              </span>
            )}
            {request.estimated_hours && (
              <span className="text-zinc-500">
                {request.estimated_hours}h est.
              </span>
            )}
          </div>

          {/* Status */}
          {statusMessages[request.status] && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              {statusMessages[request.status].icon}
              <span>{statusMessages[request.status].message}</span>
            </div>
          )}

          {/* Current task */}
          {request.current_task && (
            <div className="text-xs text-orange-400 truncate">
              {request.current_task}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Link href={`/admin/requests/${request.id}`} className="flex-1">
              <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600">
                <ExternalLink size={12} className="mr-1" />
                Ver detalle
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact view (default)
  return (
    <Card
      className={`bg-zinc-900 border-zinc-800 border-l-4 ${priorityBorder} ${staleBorder} ${activeRing} hover:bg-zinc-800 cursor-pointer transition-all max-h-24 overflow-hidden`}
      onClick={() => setIsExpanded(true)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Row 1: Number + Time + Stale indicator */}
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>#{request.request_number}</span>
              <span>{relativeTime}</span>
              {staleStatus !== 'normal' && (
                <AlertTriangle size={10} className={staleStatus === 'critical' ? 'text-red-400' : 'text-yellow-400'} />
              )}
            </div>

            {/* Row 2: Title (truncated) */}
            <div className="font-medium truncate mt-0.5">{request.title}</div>

            {/* Row 3: Project badge + status */}
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="secondary" className="text-xs truncate max-w-[120px]">
                {request.projects?.name || 'Sin proyecto'}
              </Badge>
              {statusMessages[request.status] && (
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  {statusMessages[request.status].icon}
                </div>
              )}
            </div>
          </div>

          <ChevronDown size={14} className="text-zinc-500 shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  )
}
