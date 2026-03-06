import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Search, Filter, Eye, ArrowUpDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  quoted: 'bg-purple-500/20 text-purple-400',
  negotiating: 'bg-orange-500/20 text-orange-400',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400'
}

const statusLabels: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  quoted: 'Cotizado',
  negotiating: 'Negociando',
  won: 'Ganado',
  lost: 'Perdido'
}

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
  }

  const { data: leads } = await query.limit(100)

  // Get stats
  const { data: allLeads } = await supabase.from('leads').select('status')
  const stats = {
    total: allLeads?.length || 0,
    new: allLeads?.filter(l => l.status === 'new').length || 0,
    contacted: allLeads?.filter(l => l.status === 'contacted').length || 0,
    won: allLeads?.filter(l => l.status === 'won').length || 0,
    lost: allLeads?.filter(l => l.status === 'lost').length || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-zinc-400">Gestiona tus leads y oportunidades</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatBadge label="Total" value={stats.total} />
        <StatBadge label="Nuevos" value={stats.new} color="blue" />
        <StatBadge label="Contactados" value={stats.contacted} color="yellow" />
        <StatBadge label="Ganados" value={stats.won} color="green" />
        <StatBadge label="Perdidos" value={stats.lost} color="red" />
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
                  placeholder="Buscar por nombre o email..."
                  defaultValue={params.search}
                  className="pl-10 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <select
              name="status"
              defaultValue={params.status || 'all'}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="all">Todos los status</option>
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="quoted">Cotizado</option>
              <option value="negotiating">Negociando</option>
              <option value="won">Ganado</option>
              <option value="lost">Perdido</option>
            </select>
            <Button type="submit" variant="secondary">
              <Filter size={16} className="mr-2" />
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
                  <th className="text-left p-4 text-zinc-400 font-medium">#</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Fecha</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Nombre</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Email</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden md:table-cell">Telefono</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden lg:table-cell">Tipo</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden lg:table-cell">Presupuesto</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
                  <th className="text-left p-4 text-zinc-400 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {!leads || leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-zinc-500">
                      No hay leads
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="p-4 text-zinc-500">#{lead.lead_number || '-'}</td>
                      <td className="p-4 text-zinc-400 text-sm">
                        {new Date(lead.created_at).toLocaleDateString('es-MX')}
                      </td>
                      <td className="p-4 font-medium">{lead.name}</td>
                      <td className="p-4 text-zinc-400">{lead.email}</td>
                      <td className="p-4 text-zinc-400 hidden md:table-cell">{lead.phone || '-'}</td>
                      <td className="p-4 text-zinc-400 hidden lg:table-cell">{lead.project_type || '-'}</td>
                      <td className="p-4 text-zinc-400 hidden lg:table-cell">{lead.budget || '-'}</td>
                      <td className="p-4">
                        <Badge className={statusColors[lead.status] || 'bg-zinc-700'}>
                          {statusLabels[lead.status] || lead.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Link href={`/admin/leads/${lead.id}`}>
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

function StatBadge({
  label,
  value,
  color
}: {
  label: string
  value: number
  color?: 'blue' | 'yellow' | 'green' | 'red'
}) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    green: 'bg-green-500/10 text-green-400',
    red: 'bg-red-500/10 text-red-400'
  }

  return (
    <div className={`p-4 rounded-lg ${color ? colors[color] : 'bg-zinc-800 text-zinc-300'}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  )
}
