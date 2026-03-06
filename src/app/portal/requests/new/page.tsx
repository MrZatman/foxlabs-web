'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

const REQUEST_TYPES = [
  { id: 'feature', label: 'Nueva funcionalidad', description: 'Agregar algo nuevo' },
  { id: 'bug', label: 'Corregir error', description: 'Algo no funciona bien' },
  { id: 'improvement', label: 'Mejora', description: 'Mejorar algo existente' },
  { id: 'content', label: 'Contenido', description: 'Actualizar textos/imagenes' },
]

const PRIORITIES = [
  { id: 'low', label: 'Baja', description: 'Cuando se pueda' },
  { id: 'medium', label: 'Normal', description: 'Prioridad normal' },
  { id: 'high', label: 'Alta', description: 'Lo antes posible' },
  { id: 'urgent', label: 'Urgente', description: 'Necesito esto YA' },
]

interface Project {
  id: string
  name: string
}

export default function NewRequestPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [requestNumber, setRequestNumber] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    projectId: '',
    type: '',
    priority: 'medium',
    title: '',
    description: '',
  })

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Get client
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!client) return

    // Get projects
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('client_id', client.id)
      .eq('status', 'active')

    setProjects(data || [])

    // Auto-select if only one project
    if (data && data.length === 1) {
      setFormData(prev => ({ ...prev, projectId: data[0].id }))
    }
  }

  const canSubmit = formData.projectId && formData.type && formData.title.length >= 5 && formData.description.length >= 20

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)

    try {
      const res = await fetch('/api/portal/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setRequestNumber(data.requestNumber)
        setSubmitted(true)
      } else {
        alert(data.error || 'Error al crear request')
      }
    } catch {
      alert('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
            <Check size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Request Creado!</h1>
          <p className="text-zinc-400 mb-4">
            Request: <span className="text-orange-500 font-mono">#{requestNumber}</span>
          </p>
          <p className="text-zinc-400 mb-8">
            Recibiras una notificacion cuando comencemos a trabajar en el.
          </p>
          <Link href="/portal/dashboard">
            <Button className="bg-orange-500 hover:bg-orange-600">
              Volver al Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/portal/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} />
            Volver al Dashboard
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Nuevo Request</h1>
        <p className="text-zinc-400 mb-8">Describe lo que necesitas</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project */}
          <div>
            <Label>Proyecto *</Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => setFormData({ ...formData, projectId: value })}
            >
              <SelectTrigger className="mt-2 bg-zinc-900 border-zinc-800">
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div>
            <Label>Tipo de request *</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              className="mt-2 grid grid-cols-2 gap-2"
            >
              {REQUEST_TYPES.map(type => (
                <label
                  key={type.id}
                  className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.type === type.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <RadioGroupItem value={type.id} className="sr-only" />
                  <span className="font-medium">{type.label}</span>
                  <span className="text-xs text-zinc-500">{type.description}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Priority */}
          <div>
            <Label>Prioridad</Label>
            <RadioGroup
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
              className="mt-2 grid grid-cols-4 gap-2"
            >
              {PRIORITIES.map(priority => (
                <label
                  key={priority.id}
                  className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer transition-colors ${
                    formData.priority === priority.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <RadioGroupItem value={priority.id} className="sr-only" />
                  <span className="text-sm font-medium">{priority.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Titulo *</Label>
            <Input
              id="title"
              placeholder="Resumen corto de lo que necesitas"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-2 bg-zinc-900 border-zinc-800"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descripcion *</Label>
            <Textarea
              id="description"
              placeholder="Describe con detalle lo que necesitas. Entre mas informacion, mejor."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-2 min-h-[150px] bg-zinc-900 border-zinc-800"
            />
            <p className="text-xs text-zinc-500 mt-1">
              {formData.description.length}/20 caracteres minimo
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
                Creando...
              </>
            ) : (
              'Crear Request'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
