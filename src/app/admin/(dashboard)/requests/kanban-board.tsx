'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RequestCard } from './request-card'
import { ChevronRight } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState<string>('')
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    columns.forEach(col => { initial[col.id] = ITEMS_PER_PAGE })
    return initial
  })
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set())

  // Group by status
  const requestsByStatus: Record<string, Request[]> = {}
  columns.forEach(col => {
    requestsByStatus[col.id] = requests.filter(r => r.status === col.id)
  })

  // Get non-empty columns for mobile tabs
  const nonEmptyColumns = columns.filter(col => (requestsByStatus[col.id]?.length || 0) > 0)

  // Set initial active tab to first non-empty column
  useEffect(() => {
    if (!activeTab && nonEmptyColumns.length > 0) {
      setActiveTab(nonEmptyColumns[0].id)
    } else if (!activeTab && columns.length > 0) {
      setActiveTab(columns[0].id)
    }
  }, [activeTab, nonEmptyColumns, columns])

  const loadMore = (columnId: string) => {
    setVisibleCounts(prev => ({
      ...prev,
      [columnId]: (prev[columnId] || ITEMS_PER_PAGE) + ITEMS_PER_PAGE
    }))
  }

  const toggleColumn = (columnId: string) => {
    setExpandedColumns(prev => {
      const next = new Set(prev)
      if (next.has(columnId)) {
        next.delete(columnId)
      } else {
        next.add(columnId)
      }
      return next
    })
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

  return (
    <div className="space-y-2">
      {/* Connection indicator */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
        {isConnected ? 'Realtime conectado' : 'Conectando...'}
      </div>

      {/* ========== MOBILE: Tabs (<768px) ========== */}
      <div className="md:hidden">
        {/* Tab bar - only show non-empty columns */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-1.5 w-max">
            {nonEmptyColumns.length > 0 ? (
              nonEmptyColumns.map((column) => {
                const count = requestsByStatus[column.id]?.length || 0
                const isActive = activeTab === column.id

                return (
                  <button
                    key={column.id}
                    onClick={() => setActiveTab(column.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all
                      ${isActive
                        ? 'bg-zinc-700 text-white'
                        : 'bg-zinc-800/50 text-zinc-400'
                      }
                    `}
                  >
                    <span className={`w-2 h-2 rounded-full ${column.color}`} />
                    <span>{column.label}</span>
                    <span className="text-xs opacity-60">({count})</span>
                  </button>
                )
              })
            ) : (
              <div className="text-zinc-500 text-sm py-2">Sin requests activos</div>
            )}
          </div>
        </div>

        {/* Single column content */}
        <div className="mt-2">
          {columns.map((column) => {
            if (column.id !== activeTab) return null
            const allItems = requestsByStatus[column.id] || []
            const count = allItems.length
            const visibleCount = visibleCounts[column.id] || ITEMS_PER_PAGE
            const visibleItems = allItems.slice(0, visibleCount)
            const hasMore = count > visibleCount

            return (
              <div key={column.id} className="space-y-2">
                {visibleItems.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    priorityColors={priorityColors}
                  />
                ))}
                {count === 0 && (
                  <div className="p-6 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-lg">
                    Sin requests en {column.label}
                  </div>
                )}
                {hasMore && (
                  <button
                    onClick={() => loadMore(column.id)}
                    className="w-full py-3 text-sm text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Cargar mas ({count - visibleCount} restantes)
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ========== TABLET/DESKTOP: Columns (>=768px) ========== */}
      <div className="hidden md:block">
        <div className="flex gap-2 lg:gap-3 xl:gap-4 w-full">
          {columns.map((column) => {
            const allItems = requestsByStatus[column.id] || []
            const count = allItems.length
            const isEmpty = count === 0
            const visibleCount = visibleCounts[column.id] || ITEMS_PER_PAGE
            const visibleItems = allItems.slice(0, visibleCount)
            const hasMore = count > visibleCount
            const isSaturated = count > 50
            const isWarning = count > 30 && count <= 50
            const isManuallyExpanded = expandedColumns.has(column.id)

            // Empty column - collapsed
            if (isEmpty && !isManuallyExpanded) {
              return (
                <div
                  key={column.id}
                  onClick={() => toggleColumn(column.id)}
                  className="w-10 lg:w-12 flex-shrink-0 cursor-pointer group"
                >
                  <div className="sticky top-0 bg-zinc-950 z-10 py-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </div>
                  <div className="h-20 flex items-center justify-center">
                    <span className="text-zinc-700 text-xs -rotate-90 whitespace-nowrap">
                      {column.label}
                    </span>
                  </div>
                </div>
              )
            }

            // Column with content or manually expanded
            return (
              <div
                key={column.id}
                className="flex-1 min-w-[160px] lg:min-w-[180px] xl:min-w-[220px] max-w-[320px] flex-shrink-0 transition-all duration-200"
              >
                {/* Header */}
                <div className="sticky top-0 bg-zinc-950 z-10 pb-2">
                  <div className="flex items-center gap-2 py-2">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${column.color}`} />
                    <span className="font-medium text-sm truncate">
                      {column.label}
                    </span>
                    <span className="text-zinc-500 text-sm">({count})</span>
                    {isSaturated && (
                      <span className="ml-auto text-red-400 text-xs flex-shrink-0" title="Columna saturada">
                        !!
                      </span>
                    )}
                    {isWarning && (
                      <span className="ml-auto text-yellow-400 text-xs flex-shrink-0" title="Muchos items">
                        !
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  <div className="space-y-2">
                    {visibleItems.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        priorityColors={priorityColors}
                      />
                    ))}
                    {count === 0 && (
                      <div
                        onClick={() => toggleColumn(column.id)}
                        className="p-4 text-center text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700"
                      >
                        Vacio - click para colapsar
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
