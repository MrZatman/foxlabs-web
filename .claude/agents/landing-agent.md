---
name: landing
description: Landing page y wizard cotizador para captura de leads
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Landing Agent - FoxLabs Web 🎯

Landing page pública y wizard de cotización.

## Responsabilidades

- Landing page con hero, servicios, portfolio, testimonios
- Wizard de cotización de 5 pasos
- Captura de leads a Supabase
- Notificación a Telegram de nuevos leads
- Diseño responsive con animaciones

## Carpetas Principales

- `src/app/page.tsx` - Landing
- `src/app/cotizar/page.tsx` - Wizard cotizador

## Estructura Landing

```tsx
// src/app/page.tsx
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <ServicesSection />
      <ProcessSection />
      <PortfolioSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
```

## Hero Section

```tsx
function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Desarrollo Web
            <span className="text-orange-500"> Profesional</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Creamos aplicaciones web modernas que impulsan tu negocio
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/cotizar">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Cotizar Proyecto
              </Button>
            </Link>
            <Link href="#portfolio">
              <Button variant="outline">Ver Portfolio</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
```

## Wizard Cotizador (5 pasos)

```tsx
// src/app/cotizar/page.tsx
'use client'

export default function CotizarPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    projectType: '',
    features: [] as string[],
    description: '',
    budget: '',
    timeline: '',
    name: '',
    email: '',
    phone: '',
    company: ''
  })

  const steps = [
    { num: 1, title: 'Tipo de proyecto' },
    { num: 2, title: 'Funcionalidades' },
    { num: 3, title: 'Descripción' },
    { num: 4, title: 'Presupuesto' },
    { num: 5, title: 'Contacto' }
  ]

  async function handleSubmit() {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (res.ok) {
      setStep(6) // Success step
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-800">
        <div
          className="h-full bg-orange-500 transition-all"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {/* Step content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {step === 1 && <ProjectTypeStep data={data} setData={setData} />}
        {step === 2 && <FeaturesStep data={data} setData={setData} />}
        {step === 3 && <DescriptionStep data={data} setData={setData} />}
        {step === 4 && <BudgetStep data={data} setData={setData} />}
        {step === 5 && <ContactStep data={data} setData={setData} onSubmit={handleSubmit} />}
        {step === 6 && <SuccessStep />}
      </div>
    </div>
  )
}
```

## Opciones de Proyecto

```typescript
const projectTypes = [
  { id: 'webapp', label: 'Aplicación Web', icon: Globe },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  { id: 'landing', label: 'Landing Page', icon: Layout },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'api', label: 'API/Backend', icon: Database }
]

const features = [
  { id: 'auth', label: 'Autenticación' },
  { id: 'payments', label: 'Pagos' },
  { id: 'cms', label: 'CMS' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'integrations', label: 'Integraciones' }
]

const budgets = [
  { id: '5k-10k', label: '$5,000 - $10,000' },
  { id: '10k-25k', label: '$10,000 - $25,000' },
  { id: '25k-50k', label: '$25,000 - $50,000' },
  { id: '50k+', label: '$50,000+' }
]

const timelines = [
  { id: '1-2m', label: '1-2 meses' },
  { id: '2-3m', label: '2-3 meses' },
  { id: '3-6m', label: '3-6 meses' },
  { id: '6m+', label: '6+ meses' }
]
```

## API de Leads

```typescript
// src/app/api/leads/route.ts
export async function POST(request: Request) {
  const data = await request.json()
  const supabase = await createClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      project_type: data.projectType,
      features: data.features,
      description: data.description,
      budget: data.budget,
      timeline: data.timeline,
      source: 'web'
    })
    .select('lead_number')
    .single()

  // Notify admin via Telegram
  await notifyAdmin(lead)

  return NextResponse.json({ success: true })
}
```

## Skills que uso

@.claude/skills/page-portal.md
@.claude/skills/api-routes.md
@.claude/skills/components-ui.md
