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
  AlertTriangle,
  Tag
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

// Status config
const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  inbox: { icon: <Clock size={14} />, label: 'Inbox', color: 'text-zinc-400' },
  planning: { icon: <Loader2 size={14} className="animate-spin" />, label: 'Planificando', color: 'text-blue-400' },
  pending_approval: { icon: <Clock size={14} />, label: 'Pendiente', color: 'text-yellow-400' },
  approved: { icon: <CheckCircle size={14} />, label: 'Aprobado', color: 'text-purple-400' },
  queued: { icon: <Clock size={14} />, label: 'En cola', color: 'text-indigo-400' },
  in_progress: { icon: <Bot size={14} className="animate-pulse" />, label: 'Ejecutando', color: 'text-orange-400' },
  pending_review: { icon: <Clock size={14} />, label: 'Review', color: 'text-cyan-400' },
  pending_deploy: { icon: <Loader2 size={14} className="animate-spin" />, label: 'Deploy', color: 'text-pink-400' },
  completed: { icon: <CheckCircle size={14} />, label: 'Completado', color: 'text-green-400' },
  cancelled: { icon: null, label: 'Cancelado', color: 'text-red-400' },
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

// Get stale status
function getStaleStatus(updatedAt: string): 'normal' | 'warning' | 'critical' {
  const hours = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60))
  if (hours >= 72) return 'critical'
  if (hours >= 24) return 'warning'
  return 'normal'
}

export function RequestCard({ request, priorityColors }: RequestCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const staleStatus = getStaleStatus(request.updated_at)
  const relativeTime = getRelativeTime(request.updated_at)
  const status = statusConfig[request.status] || statusConfig.inbox

  // Border classes
  const priorityBorder = priorityColors[request.priority] || 'border-l-zinc-500'
  const staleBorder = staleStatus === 'critical'
    ? 'border-t-2 border-t-red-500'
    : staleStatus === 'warning'
      ? 'border-t-2 border-t-yellow-500'
      : ''

  const isActive = ['in_progress', 'planning', 'pending_deploy'].includes(request.status)

  // EXPANDED VIEW
  if (isExpanded) {
    return (
      <Card
        className={`bg-zinc-900 border-zinc-800 border-l-4 ${priorityBorder} ${staleBorder} ${isActive ? 'ring-1 ring-orange-500/30' : ''}`}
      >
        <CardContent className="p-0">
          {/* Header */}
          <div
            className="flex items-center justify-between p-3 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/50"
            onClick={() => setIsExpanded(false)}
          >
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="font-mono">#{request.request_number}</span>
              <span>•</span>
              <span>{relativeTime}</span>
              {staleStatus !== 'normal' && (
                <AlertTriangle size={14} className={staleStatus === 'critical' ? 'text-red-400' : 'text-yellow-400'} />
              )}
            </div>
            <ChevronUp size={20} className="text-zinc-400" />
          </div>

          {/* Title - Full */}
          <div className="px-3 py-2 border-b border-zinc-800/50">
            <p className="font-medium text-white leading-snug">
              {request.title}
            </p>
          </div>

          {/* Description */}
          {request.description && (
            <div className="px-3 py-2 border-b border-zinc-800/50">
              <p className="text-sm text-zinc-400 leading-relaxed">
                {request.description}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="px-3 py-2 flex flex-wrap items-center gap-2 border-b border-zinc-800/50">
            <div className="flex items-center gap-1.5">
              <Tag size={12} className="text-zinc-500" />
              <span className="text-sm text-zinc-300">
                {request.projects?.name || 'Sin proyecto'}
              </span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className={`flex items-center gap-1.5 ${status.color}`}>
              {status.icon}
              <span className="text-sm">{status.label}</span>
            </div>
          </div>

          {/* Action */}
          <div className="p-3">
            <Link href={`/admin/requests/${request.id}`}>
              <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600">
                <ExternalLink size={14} className="mr-2" />
                Ver detalle
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // COMPACT VIEW (default)
  return (
    <Card
      className={`bg-zinc-900 border-zinc-800 border-l-4 ${priorityBorder} ${staleBorder} ${isActive ? 'ring-1 ring-orange-500/30' : ''} hover:bg-zinc-800 cursor-pointer transition-colors`}
      onClick={() => setIsExpanded(true)}
    >
      <CardContent className="p-0">
        {/* Header row */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="font-mono">#{request.request_number}</span>
            <span>•</span>
            <span>{relativeTime}</span>
            {staleStatus !== 'normal' && (
              <AlertTriangle size={12} className={staleStatus === 'critical' ? 'text-red-400' : 'text-yellow-400'} />
            )}
          </div>
          <ChevronDown size={20} className="text-zinc-500" />
        </div>

        {/* Title - 2 lines max */}
        <div className="px-3 py-1">
          <p className="font-medium text-white leading-snug line-clamp-2">
            {request.title}
          </p>
        </div>

        {/* Project badge */}
        <div className="px-3 pb-3 pt-1">
          <Badge variant="secondary" className="text-xs">
            <Tag size={10} className="mr-1" />
            {request.projects?.name || 'Sin proyecto'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
