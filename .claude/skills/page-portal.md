# Portal Pages

Paginas del portal de clientes en `/portal/`.

## Estructura

```
src/app/portal/
├── login/page.tsx        # Login de clientes
├── dashboard/page.tsx    # Dashboard con proyectos y requests
└── requests/
    ├── new/page.tsx      # Crear nuevo request
    └── [id]/page.tsx     # Detalle de request
```

## Dashboard Page

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Verificar auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  // 2. Obtener cliente por email
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!client) {
    return (
      <PortalLayout user={user}>
        <div className="text-center py-12">
          <h2>Cuenta no encontrada</h2>
          <p className="text-zinc-400">
            Tu email no esta asociado a ningun cliente.
          </p>
        </div>
      </PortalLayout>
    )
  }

  // 3. Obtener proyectos del cliente
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, production_url, status')
    .eq('client_id', client.id)

  // 4. Obtener requests de esos proyectos
  const { data: requests } = await supabase
    .from('requests')
    .select(`id, request_number, title, status, created_at, projects(name)`)
    .in('project_id', projects?.map(p => p.id) || [])
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <PortalLayout user={user}>
      <h1>Hola, {client.contact_name || client.name}!</h1>
      {/* Content... */}
    </PortalLayout>
  )
}
```

## Portal Layout Component

```tsx
function PortalLayout({ user, children }: {
  user: { email?: string }
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/portal/dashboard" className="text-xl font-bold text-orange-500">
            FoxLabs
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user.email}</span>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut size={16} />
              </Button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

## Status Badge

```tsx
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { class: string; label: string }> = {
    inbox: { class: 'bg-zinc-500/20 text-zinc-400', label: 'Recibido' },
    planning: { class: 'bg-blue-500/20 text-blue-400', label: 'Planificando' },
    approved: { class: 'bg-purple-500/20 text-purple-400', label: 'Aprobado' },
    in_progress: { class: 'bg-orange-500/20 text-orange-400', label: 'En Progreso' },
    deploying: { class: 'bg-cyan-500/20 text-cyan-400 animate-pulse', label: 'Publicando...' },
    completed: { class: 'bg-green-500/20 text-green-400', label: 'Completado' }
  }

  const variant = variants[status] || { class: 'bg-zinc-700', label: status }

  return (
    <span className={`text-xs px-2 py-1 rounded ${variant.class}`}>
      {variant.label}
    </span>
  )
}
```

## DO

- Verificar auth primero: `supabase.auth.getUser()`
- Usar `redirect()` de `next/navigation` para redirigir
- Filtrar por `client_id` para seguridad
- Usar colores orange para CTA (brand color)

## DON'T

- NO exponer datos de otros clientes
- NO confiar solo en middleware (verificar en page)
- NO usar colores diferentes al brand (orange-500)
