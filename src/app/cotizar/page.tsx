'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'

const PROJECT_TYPES = [
  { id: 'web', label: 'Aplicacion Web', description: 'Dashboard, SaaS, portal' },
  { id: 'ecommerce', label: 'E-commerce', description: 'Tienda online con pagos' },
  { id: 'landing', label: 'Landing Page', description: 'Pagina de presentacion' },
  { id: 'api', label: 'API / Backend', description: 'Servicios y APIs' },
  { id: 'other', label: 'Otro', description: 'Algo diferente' },
]

const FEATURES = [
  { id: 'auth', label: 'Autenticacion de usuarios' },
  { id: 'payments', label: 'Pagos online (Stripe)' },
  { id: 'dashboard', label: 'Panel de administracion' },
  { id: 'notifications', label: 'Notificaciones (email/push)' },
  { id: 'analytics', label: 'Analytics y reportes' },
  { id: 'api', label: 'API publica' },
  { id: 'mobile', label: 'Diseño responsive/mobile' },
  { id: 'seo', label: 'SEO optimizado' },
]

const BUDGETS = [
  { id: 'small', label: '$1,000 - $3,000', description: 'Proyecto pequeño' },
  { id: 'medium', label: '$3,000 - $8,000', description: 'Proyecto mediano' },
  { id: 'large', label: '$8,000 - $15,000', description: 'Proyecto grande' },
  { id: 'enterprise', label: '$15,000+', description: 'Enterprise' },
  { id: 'unsure', label: 'No estoy seguro', description: 'Necesito asesoria' },
]

const TIMELINES = [
  { id: 'urgent', label: '1-2 semanas', description: 'Urgente' },
  { id: 'normal', label: '3-4 semanas', description: 'Normal' },
  { id: 'relaxed', label: '1-2 meses', description: 'Sin prisa' },
  { id: 'flexible', label: 'Flexible', description: 'Sin fecha limite' },
]

interface FormData {
  projectType: string
  features: string[]
  description: string
  referenceUrls: string
  budget: string
  timeline: string
  name: string
  email: string
  phone: string
  company: string
}

export default function CotizarPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [leadNumber, setLeadNumber] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
    projectType: '',
    features: [],
    description: '',
    referenceUrls: '',
    budget: '',
    timeline: '',
    name: '',
    email: '',
    phone: '',
    company: '',
  })

  const progress = (step / 5) * 100

  const canProceed = () => {
    switch (step) {
      case 1: return formData.projectType !== ''
      case 2: return true // Features are optional
      case 3: return formData.description.length >= 20
      case 4: return formData.budget !== '' && formData.timeline !== ''
      case 5: return formData.name !== '' && formData.email !== ''
      default: return false
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setLeadNumber(data.leadNumber)
        setSubmitted(true)
      } else {
        alert('Error al enviar. Intenta de nuevo.')
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
          <h1 className="text-2xl font-bold mb-2">Solicitud Recibida!</h1>
          <p className="text-zinc-400 mb-4">
            Folio: <span className="text-orange-500 font-mono">#{leadNumber}</span>
          </p>
          <p className="text-zinc-400 mb-8">
            Te contactaremos en las proximas 24 horas con una propuesta personalizada.
          </p>
          <Link href="/">
            <Button variant="outline">Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} />
            Volver
          </Link>
          <span className="text-sm text-zinc-500">Paso {step} de 5</span>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Project Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Que tipo de proyecto necesitas?</h2>
              <p className="text-zinc-400">Selecciona la opcion que mejor describa tu idea</p>
            </div>
            <RadioGroup
              value={formData.projectType}
              onValueChange={(value) => setFormData({ ...formData, projectType: value })}
              className="space-y-3"
            >
              {PROJECT_TYPES.map((type) => (
                <label
                  key={type.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.projectType === type.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <RadioGroupItem value={type.id} />
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-zinc-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Step 2: Features */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Que funcionalidades necesitas?</h2>
              <p className="text-zinc-400">Selecciona todas las que apliquen (opcional)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FEATURES.map((feature) => (
                <label
                  key={feature.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.features.includes(feature.id)
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Checkbox
                    checked={formData.features.includes(feature.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ ...formData, features: [...formData.features, feature.id] })
                      } else {
                        setFormData({
                          ...formData,
                          features: formData.features.filter((f) => f !== feature.id),
                        })
                      }
                    }}
                  />
                  <span>{feature.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Description */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Cuentanos mas sobre tu proyecto</h2>
              <p className="text-zinc-400">Entre mas detalle, mejor podremos ayudarte</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Descripcion del proyecto *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe tu idea, que problema resuelve, quienes son tus usuarios..."
                  className="mt-2 min-h-[150px] bg-zinc-900 border-zinc-800"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {formData.description.length}/20 caracteres minimo
                </p>
              </div>
              <div>
                <Label htmlFor="urls">Referencias (opcional)</Label>
                <Textarea
                  id="urls"
                  placeholder="Links a sitios similares o de inspiracion, uno por linea"
                  className="mt-2 bg-zinc-900 border-zinc-800"
                  value={formData.referenceUrls}
                  onChange={(e) => setFormData({ ...formData, referenceUrls: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Budget & Timeline */}
        {step === 4 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Presupuesto y tiempo</h2>
              <p className="text-zinc-400">Esto nos ayuda a priorizar y planificar</p>
            </div>

            <div className="space-y-4">
              <Label>Presupuesto estimado *</Label>
              <RadioGroup
                value={formData.budget}
                onValueChange={(value) => setFormData({ ...formData, budget: value })}
                className="space-y-2"
              >
                {BUDGETS.map((budget) => (
                  <label
                    key={budget.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                      formData.budget === budget.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <RadioGroupItem value={budget.id} />
                    <div>
                      <div className="font-medium">{budget.label}</div>
                      <div className="text-sm text-zinc-500">{budget.description}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label>Cuando lo necesitas? *</Label>
              <RadioGroup
                value={formData.timeline}
                onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                className="grid grid-cols-2 gap-2"
              >
                {TIMELINES.map((timeline) => (
                  <label
                    key={timeline.id}
                    className={`flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                      formData.timeline === timeline.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <RadioGroupItem value={timeline.id} className="sr-only" />
                    <div className="font-medium text-center">{timeline.label}</div>
                    <div className="text-xs text-zinc-500">{timeline.description}</div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Step 5: Contact */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tus datos de contacto</h2>
              <p className="text-zinc-400">Para enviarte la propuesta</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Tu nombre"
                  className="mt-2 bg-zinc-900 border-zinc-800"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="mt-2 bg-zinc-900 border-zinc-800"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefono / WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="+52 ..."
                  className="mt-2 bg-zinc-900 border-zinc-800"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company">Empresa (opcional)</Label>
                <Input
                  id="company"
                  placeholder="Nombre de tu empresa"
                  className="mt-2 bg-zinc-900 border-zinc-800"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="border-zinc-700"
          >
            <ArrowLeft className="mr-2" size={16} />
            Anterior
          </Button>

          {step < 5 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Siguiente
              <ArrowRight className="ml-2" size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Solicitud
                  <Check className="ml-2" size={16} />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
