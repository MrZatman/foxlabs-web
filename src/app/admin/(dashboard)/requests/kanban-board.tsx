'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RequestCard } from './request-card'

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

const ITEMS_PER_PAGE = 20

export function KanbanBoard({ initialRequests, columns, priorityColors }: Props) {
  const [requests, setRequests] = useState<Request[]>(initialRequests)
  const [isConnected, setIsConnected] = useState(false)
  const [activeTab, setActiveTab] = useState(columns[0]?.id || 'inbox')
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    columns.forEach(col => { initial[col.id] = ITEMS_PER_PAGE })
    return initial
  })

  const loadMore = (columnId: string) => {
    setVisibleCounts(prev => ({
      ...prev,
      [columnId]: (prev[columnId] || ITEMS_PER_PAGE) + ITEMS_PER_PAGE
    }))
  }

  useEffect(() => {
    const supabase = createClient()

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

      {/* Mobile: Tab bar */}
      <div className="md:hidden overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">
          {columns.map((column) => {
            const count = requestsByStatus[column.id]?.length || 0
            const isActive = activeTab === column.id

            return (
              <button
                key={column.id}
                onClick={() => setActiveTab(column.id)}
                className={`
                  px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all
                  ${isActive
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                  }
                `}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${column.color}`} />
                {column.label}
                {count > 0 && (
                  <span className="ml-1 text-xs opacity-70">({count})</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile: Single column view */}
      <div className="md:hidden">
        {columns.map((column) => {
          if (column.id !== activeTab) return null
          const allItems = requestsByStatus[column.id] || []
          const count = allItems.length
          const visibleCount = visibleCounts[column.id] || ITEMS_PER_PAGE
          const visibleItems = allItems.slice(0, visibleCount)
          const hasMore = count > visibleCount
          const isSaturated = count > 50
          const isWarning = count > 30 && count <= 50

          return (
            <div key={column.id}>
              <div className="flex items-center gap-2 py-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <span className="font-medium">
                  {column.label} ({count})
                </span>
                {isSaturated && (
                  <span className="ml-auto text-red-400 text-xs">!!</span>
                )}
                {isWarning && (
                  <span className="ml-auto text-yellow-400 text-xs">!</span>
                )}
              </div>
              <div className="space-y-2">
                {visibleItems.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    priorityColors={priorityColors}
                  />
                ))}
                {count === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-lg">
                    Sin requests
                  </div>
                )}
                {hasMore && (
                  <button
                    onClick={() => loadMore(column.id)}
                    className="w-full py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Cargar mas ({count - visibleCount} restantes)
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: Full Kanban */}
      <div className="hidden md:block overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => {
            const allItems = requestsByStatus[column.id] || []
            const count = allItems.length
            const visibleCount = visibleCounts[column.id] || ITEMS_PER_PAGE
            const visibleItems = allItems.slice(0, visibleCount)
            const hasMore = count > visibleCount
            const isSaturated = count > 50
            const isWarning = count > 30 && count <= 50

            return (
              <div key={column.id} className="w-72 flex-shrink-0">
                {/* Sticky header */}
                <div className="sticky top-0 bg-zinc-950 z-10 pb-2">
                  <div className="flex items-center gap-2 py-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <span className="font-medium">
                      {column.label} ({count})
                    </span>
                    {isSaturated && (
                      <span className="ml-auto text-red-400 text-xs" title="Columna saturada">
                        !!
                      </span>
                    )}
                    {isWarning && (
                      <span className="ml-auto text-yellow-400 text-xs" title="Muchos items">
                        !
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                  <div className="space-y-2">
                    {visibleItems.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        priorityColors={priorityColors}
                      />
                    ))}
                    {count === 0 && (
                      <div className="p-4 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-lg">
                        Sin requests
                      </div>
                    )}
                    {hasMore && (
                      <button
                        onClick={() => loadMore(column.id)}
                        className="w-full py-2 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        +{count - visibleCount} mas
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
