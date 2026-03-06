import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderKanban,
  ListTodo,
  Chrome,
  Database,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  Bell,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

const ADMIN_EMAIL = 'fer.frias0000@gmail.com'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/leads', icon: Users, label: 'Leads' },
  { href: '/admin/clients', icon: Briefcase, label: 'Clientes' },
  { href: '/admin/projects', icon: FolderKanban, label: 'Proyectos' },
  { href: '/admin/requests', icon: ListTodo, label: 'Requests' },
  { href: '/admin/chrome', icon: Chrome, label: 'Chrome Profiles' },
  { href: '/admin/supabase', icon: Database, label: 'Supabase' },
  { href: '/admin/metrics', icon: BarChart3, label: 'Metricas' },
  { href: '/admin/activity', icon: Activity, label: 'Activity Log' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

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
          <Button variant="ghost" size="sm" className="w-full justify-start text-zinc-400 hover:text-white" type="submit">
            <LogOut size={18} className="mr-2" />
            Cerrar sesion
          </Button>
        </form>
      </div>
    </div>
  )
}

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  if (user.email !== ADMIN_EMAIL) {
    redirect('/admin/login?error=unauthorized')
  }

  // Get pending notifications count
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
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
          {/* Mobile Menu */}
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

          <div className="lg:hidden" />

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* System Status */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-zinc-400">Sistema Online</span>
            </div>

            {/* Notifications */}
            <Link href="/admin/activity">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={18} />
                {notificationsCount && notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] flex items-center justify-center">
                    {notificationsCount > 9 ? '9+' : notificationsCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <span className="text-sm font-medium text-orange-500">F</span>
              </div>
              <span className="hidden sm:block text-sm text-zinc-400">{user.email}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
