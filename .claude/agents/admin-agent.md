---
name: admin
description: Dashboard administrativo con layout y navegación
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Admin Agent - FoxLabs Web 🛡️

Dashboard administrativo con sidebar, layout y protección de rutas.

## Responsabilidades

- Layout con sidebar navegable
- Protección de rutas solo para admin (fer.frias0000@gmail.com)
- Header con notificaciones y estado del sistema
- Mobile menu con Sheet
- Páginas de gestión: leads, clients, projects, requests

## Carpeta Principal

`src/app/admin/(dashboard)/`

## Estructura de Navegación

```typescript
const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/leads', icon: Users, label: 'Leads' },
  { href: '/admin/clients', icon: Briefcase, label: 'Clientes' },
  { href: '/admin/projects', icon: FolderKanban, label: 'Proyectos' },
  { href: '/admin/requests', icon: ListTodo, label: 'Requests' },
  { href: '/admin/chrome', icon: Chrome, label: 'Chrome Profiles' },
  { href: '/admin/supabase', icon: Database, label: 'Supabase' },
  { href: '/admin/recursos', icon: Layers, label: 'Recursos' },
  { href: '/admin/metrics', icon: BarChart3, label: 'Metricas' },
  { href: '/admin/monitor', icon: Monitor, label: 'Monitor' },
  { href: '/admin/activity', icon: Activity, label: 'Activity Log' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]
```

## Layout Principal

```tsx
// src/app/admin/(dashboard)/layout.tsx
const ADMIN_EMAIL = 'fer.frias0000@gmail.com'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verificar auth
  if (!user) {
    redirect('/admin/login')
  }

  // Verificar es admin
  if (user.email !== ADMIN_EMAIL) {
    redirect('/admin/login?error=unauthorized')
  }

  // Get pending notifications
  const { count: notificationsCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="fixed w-64 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 h-16 px-4 border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
          {/* Mobile menu + notifications */}
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## Sidebar Component

```tsx
function Sidebar({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col h-full bg-zinc-950 border-r border-zinc-800 ${className}`}>
      <div className="p-4 border-b border-zinc-800">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-bold text-orange-500">FoxLabs</span>
          <Badge variant="secondary" className="text-xs">Admin</Badge>
        </Link>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-zinc-800">
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <LogOut size={18} className="mr-2" />
            Cerrar sesion
          </Button>
        </form>
      </div>
    </div>
  )
}
```

## Mobile Menu con Sheet

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="lg:hidden">
      <Menu size={20} />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="p-0 w-64 bg-zinc-950 border-zinc-800">
    <Sidebar />
  </SheetContent>
</Sheet>
```

## Skills que uso

@.claude/skills/page-admin.md
@.claude/skills/auth-patterns.md
@.claude/skills/components-ui.md
