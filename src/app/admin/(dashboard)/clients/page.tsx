import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Search, Eye, FolderKanban, Mail, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default async function ClientsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; portal?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select(`
      *,
      projects:projects(count)
    `)
    .order('created_at', { ascending: false })

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%,contact_name.ilike.%${params.search}%`)
  }

  if (params.portal === 'active') {
    query = query.eq('portal_enabled', true)
  } else if (params.portal === 'inactive') {
    query = query.eq('portal_enabled', false)
  }

  const { data: clients } = await query.limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-zinc-400">Gestiona tus clientes y sus proyectos</p>
        </div>
        <Link href="/admin/clients/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus size={16} className="mr-2" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <Input
                  name="search"
                  placeholder="Buscar por nombre, contacto o email..."
                  defaultValue={params.search}
                  className="pl-10 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <select
              name="portal"
              defaultValue={params.portal || 'all'}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="all">Todos</option>
              <option value="active">Portal activo</option>
              <option value="inactive">Portal inactivo</option>
            </select>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-zinc-400 font-medium">Empresa</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Contacto</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden md:table-cell">Email</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden lg:table-cell">Telefono</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Proyectos</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Portal</th>
                  <th className="text-left p-4 text-zinc-400 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {!clients || clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                      No hay clientes
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <span className="text-orange-500 font-medium">
                              {client.name?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            {client.is_vip && (
                              <Badge variant="secondary" className="text-xs">VIP</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-400">{client.contact_name || '-'}</td>
                      <td className="p-4 text-zinc-400 hidden md:table-cell">
                        <a href={`mailto:${client.email}`} className="hover:text-white flex items-center gap-1">
                          <Mail size={14} />
                          {client.email}
                        </a>
                      </td>
                      <td className="p-4 text-zinc-400 hidden lg:table-cell">
                        {client.phone ? (
                          <a href={`tel:${client.phone}`} className="hover:text-white flex items-center gap-1">
                            <Phone size={14} />
                            {client.phone}
                          </a>
                        ) : '-'}
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <FolderKanban size={12} />
                          {(client.projects as { count: number }[])?.[0]?.count || 0}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {client.portal_enabled ? (
                          <Badge className="bg-green-500/20 text-green-400">Activo</Badge>
                        ) : (
                          <Badge className="bg-zinc-700 text-zinc-400">Inactivo</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <Link href={`/admin/clients/${client.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye size={16} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
