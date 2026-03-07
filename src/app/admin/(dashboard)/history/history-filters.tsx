'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface Props {
  clients: Array<{ id: string; name: string }>
  projects: Array<{ id: string; name: string }>
  values: {
    from: string
    to: string
    client: string
    project: string
    status: string
    priority: string
    type: string
    source: string
    search: string
  }
}

const statuses = [
  { value: '', label: 'Todos los status' },
  { value: 'inbox', label: 'Inbox' },
  { value: 'planning', label: 'Planificando' },
  { value: 'pending_approval', label: 'Esperando Aprobacion' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'queued', label: 'En Cola' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'pending_review', label: 'En Review' },
  { value: 'pending_deploy', label: 'Desplegando' },
  { value: 'completed', label: 'Completado' },
  { value: 'failed', label: 'Fallido' },
  { value: 'cancelled', label: 'Cancelado' }
]

const priorities = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' }
]

const types = [
  { value: '', label: 'Todos los tipos' },
  { value: 'feature', label: 'Feature' },
  { value: 'bug', label: 'Bug' },
  { value: 'change', label: 'Cambio' },
  { value: 'support', label: 'Soporte' },
  { value: 'other', label: 'Otro' }
]

const sources = [
  { value: '', label: 'Todas las fuentes' },
  { value: 'portal', label: 'Portal' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'admin', label: 'Admin' }
]

export function HistoryFilters({ clients, projects, values }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams()

    // Preserve tab
    const currentTab = searchParams.get('tab')
    if (currentTab) params.set('tab', currentTab)

    // Add all filter values
    formData.forEach((value, key) => {
      if (value && value !== '') {
        params.set(key, value.toString())
      }
    })

    router.push(`/admin/history?${params.toString()}`)
  }

  const handleClear = () => {
    const currentTab = searchParams.get('tab')
    const params = currentTab ? `?tab=${currentTab}` : ''
    router.push(`/admin/history${params}`)
  }

  const hasFilters = values.client || values.project || values.status ||
    values.priority || values.type || values.source || values.search

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Dates and Search */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-400 whitespace-nowrap">Desde:</label>
              <Input
                type="date"
                name="from"
                defaultValue={values.from}
                className="w-36 bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-400 whitespace-nowrap">Hasta:</label>
              <Input
                type="date"
                name="to"
                defaultValue={values.to}
                className="w-36 bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <Input
                  name="search"
                  placeholder="Buscar por titulo o descripcion..."
                  defaultValue={values.search}
                  className="pl-9 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <select
              name="client"
              defaultValue={values.client}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
            >
              <option value="">Todos los clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              name="project"
              defaultValue={values.project}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
            >
              <option value="">Todos los proyectos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={values.status}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              name="priority"
              defaultValue={values.priority}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
            >
              {priorities.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <select
              name="type"
              defaultValue={values.type}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
            >
              {types.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              name="source"
              defaultValue={values.source}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
            >
              {sources.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <div className="flex gap-2 ml-auto">
              {hasFilters && (
                <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                  <X size={16} className="mr-1" />
                  Limpiar
                </Button>
              )}
              <Button type="submit" size="sm">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
