# Admin Pages

Paginas del dashboard administrativo en `/admin/`.

## Estructura de Carpetas

```
src/app/admin/
├── (auth)/
│   ├── layout.tsx      # Layout minimo para login
│   └── login/page.tsx  # Pagina de login admin
└── (dashboard)/
    ├── layout.tsx      # Layout con sidebar
    ├── page.tsx        # Dashboard principal
    ├── clients/
    ├── projects/
    ├── requests/
    ├── leads/
    └── monitor/
```

## Page Async con Server Component

```tsx
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminPage() {
  const supabase = await createClient()

  // Multiple queries en paralelo
  const [
    { count: clientsCount },
    { data: recentRequests }
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('requests').select('*').order('created_at', { ascending: false }).limit(5)
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Clientes" value={clientsCount || 0} />
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Requests Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests?.map(request => (
            <div key={request.id}>{request.title}</div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

## Helper Components Locales

```tsx
function StatCard({ label, value, color = 'blue' }: {
  label: string
  value: number
  color?: 'blue' | 'green' | 'yellow'
}) {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/10',
    green: 'text-green-500 bg-green-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10'
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
          <Users size={20} />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-zinc-500">{label}</div>
      </CardContent>
    </Card>
  )
}
```

## Filtrado por Query Params

```tsx
// En page con searchParams
export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('leads').select('*')
  if (status) {
    query = query.eq('status', status)
  }

  const { data: leads } = await query.order('created_at', { ascending: false })

  // ...
}
```

## DO

- Usar `async function` para Server Components
- Usar `createClient()` de `@/lib/supabase/server`
- Hacer queries en paralelo con `Promise.all`
- Usar shadcn/ui components (Card, Badge, Button, etc)
- Estilos: `bg-zinc-900 border-zinc-800` para cards

## DON'T

- NO usar `'use client'` a menos que necesites interactividad
- NO importar hooks de React en Server Components
- NO olvidar `await` en `createClient()` y queries
