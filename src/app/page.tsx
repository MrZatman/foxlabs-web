import Link from 'next/link'
import { ArrowRight, Code2, Rocket, Zap, CheckCircle, MessageSquare, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-orange-500">
            FoxLabs
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/portal/login" className="text-sm text-zinc-400 hover:text-white">
              Portal Clientes
            </Link>
            <Link href="/cotizar">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Cotizar Proyecto
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Tu idea, <span className="text-orange-500">desplegada</span> en dias
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Convertimos ideas en aplicaciones web profesionales usando IA.
            Sin reuniones interminables. Sin costos ocultos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cotizar">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8">
                Cotiza Gratis <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
            <Link href="#proceso">
              <Button size="lg" variant="outline" className="text-lg px-8 border-zinc-700">
                Como Funciona
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat number="50+" label="Proyectos entregados" />
          <Stat number="24h" label="Tiempo de respuesta" />
          <Stat number="100%" label="Clientes satisfechos" />
          <Stat number="5x" label="Mas rapido que agencias" />
        </div>
      </section>

      {/* Que hacemos */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Que hacemos
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Desarrollamos aplicaciones web completas usando las mejores tecnologias
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon={<Code2 size={32} />}
              title="Desarrollo Web"
              description="Aplicaciones modernas con Next.js, React, y bases de datos escalables"
            />
            <ServiceCard
              icon={<Rocket size={32} />}
              title="Deploy Automatico"
              description="Tu proyecto en produccion con dominio personalizado y SSL incluido"
            />
            <ServiceCard
              icon={<Zap size={32} />}
              title="Mantenimiento"
              description="Actualizaciones, mejoras y soporte continuo para tu aplicacion"
            />
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section id="proceso" className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Proceso Simple
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            De tu idea a produccion en 4 pasos
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            <ProcessStep number={1} title="Cotiza" description="Describe tu proyecto y recibe una cotizacion en 24h" />
            <ProcessStep number={2} title="Aprueba" description="Revisa el plan y aprueba para comenzar" />
            <ProcessStep number={3} title="Desarrollo" description="Nuestro equipo + IA construye tu proyecto" />
            <ProcessStep number={4} title="Lanzamiento" description="Tu app en produccion, lista para usuarios" />
          </div>
        </div>
      </section>

      {/* Portafolio */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Proyectos Destacados
          </h2>
          <p className="text-zinc-400 text-center mb-12">
            Algunos de los proyectos que hemos desarrollado
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <ProjectCard
              name="E-commerce Fashion"
              type="Tienda Online"
              tech="Next.js + Stripe"
            />
            <ProjectCard
              name="App de Reservas"
              type="SaaS"
              tech="Next.js + Supabase"
            />
            <ProjectCard
              name="Dashboard Analytics"
              type="Panel Admin"
              tech="React + PostgreSQL"
            />
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Lo que dicen nuestros clientes
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <TestimonialCard
              quote="Entregaron mi tienda online en una semana. Increible velocidad y calidad."
              author="Maria G."
              company="Boutique Luna"
            />
            <TestimonialCard
              quote="El proceso fue transparente y el resultado supero mis expectativas."
              author="Carlos R."
              company="Consulting Pro"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Listo para comenzar?
          </h2>
          <p className="text-zinc-400 mb-8 text-lg">
            Cotiza tu proyecto gratis. Sin compromiso.
          </p>
          <Link href="/cotizar">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8">
              Cotiza Ahora <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-zinc-500 text-sm">
            2026 FoxLabs. Desarrollo de software a medida.
          </div>
          <div className="flex gap-6 text-sm text-zinc-400">
            <Link href="/cotizar" className="hover:text-white">Cotizar</Link>
            <Link href="/portal/login" className="hover:text-white">Portal</Link>
            <a href="https://t.me/FoxLabsDev_bot" className="hover:text-white">Telegram</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-orange-500">{number}</div>
      <div className="text-sm text-zinc-400 mt-1">{label}</div>
    </div>
  )
}

function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors">
      <div className="text-orange-500 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  )
}

function ProcessStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-orange-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm">{description}</p>
    </div>
  )
}

function ProjectCard({ name, type, tech }: { name: string; type: string; tech: string }) {
  return (
    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-orange-500/50 transition-colors">
      <div className="h-32 bg-zinc-800 rounded-lg mb-4 flex items-center justify-center text-zinc-600">
        Preview
      </div>
      <h3 className="font-semibold mb-1">{name}</h3>
      <p className="text-sm text-zinc-400">{type}</p>
      <p className="text-xs text-orange-500 mt-2">{tech}</p>
    </div>
  )
}

function TestimonialCard({ quote, author, company }: { quote: string; author: string; company: string }) {
  return (
    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <MessageSquare className="text-orange-500 mb-4" size={24} />
      <p className="text-zinc-300 mb-4 italic">&quot;{quote}&quot;</p>
      <div>
        <div className="font-semibold">{author}</div>
        <div className="text-sm text-zinc-500">{company}</div>
      </div>
    </div>
  )
}
