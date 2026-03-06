import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ExternalLink, RefreshCw, Eye, EyeOff, Copy, Chrome, FolderKanban } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function SupabaseProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sp, error } = await supabase
    .from('supabase_projects')
    .select(`
      *,
      chrome_profiles(id, email, name),
      projects(id, name, slug, clients(name))
    `)
    .eq('id', id)
    .single()

  if (error || !sp) {
    notFound()
  }

  const dashboardUrl = sp.ref
    ? `https://supabase.com/dashboard/project/${sp.ref}`
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/supabase">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{sp.name}</h1>
          <p className="text-zinc-400 font-mono">{sp.ref}</p>
        </div>
        <Badge className={
          sp.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
          sp.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-zinc-500/20 text-zinc-400'
        }>
          {sp.status || 'unknown'}
        </Badge>
        {dashboardUrl && (
          <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <ExternalLink size={16} className="mr-2" />
              Dashboard
            </Button>
          </a>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Informacion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-zinc-400 mb-1">Nombre</div>
                  <div className="font-medium">{sp.name}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-400 mb-1">Ref</div>
                  <div className="font-mono">{sp.ref}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-400 mb-1">Region</div>
                  <div>{sp.region || 'No especificada'}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-400 mb-1">URL</div>
                  <div className="text-sm font-mono truncate">{sp.url || '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Credenciales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CredentialField
                label="Anon Key"
                value={sp.anon_key}
              />
              <CredentialField
                label="Service Role Key"
                value={sp.service_role_key}
                sensitive
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline">
                <RefreshCw size={16} className="mr-2" />
                Test Conexion
              </Button>
              {(sp.projects as { id: string } | null) && (
                <Button variant="outline" className="text-red-400 hover:text-red-300">
                  Desasignar de Proyecto
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Chrome Profile */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Chrome size={18} />
                Perfil Chrome
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(sp.chrome_profiles as { id: string; email: string; name: string } | null) ? (
                <Link
                  href={`/admin/chrome/${(sp.chrome_profiles as { id: string }).id}`}
                  className="block p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                >
                  <div className="font-medium">
                    {(sp.chrome_profiles as unknown as { name: string }).name || (sp.chrome_profiles as { email: string }).email}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {(sp.chrome_profiles as { email: string }).email}
                  </div>
                </Link>
              ) : (
                <p className="text-zinc-500">Sin perfil asignado</p>
              )}
            </CardContent>
          </Card>

          {/* Assigned Project */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban size={18} />
                Proyecto Asignado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(sp.projects as { id: string; name: string; slug: string; clients: { name: string } } | null) ? (
                <Link
                  href={`/admin/projects/${(sp.projects as { slug: string }).slug || (sp.projects as { id: string }).id}`}
                  className="block p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                >
                  <div className="font-medium">{(sp.projects as unknown as { name: string }).name}</div>
                  <div className="text-sm text-zinc-400">
                    {((sp.projects as { clients: { name: string } }).clients as unknown as { name: string })?.name || 'Sin cliente'}
                  </div>
                </Link>
              ) : (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-center">
                  Libre - Disponible para asignar
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CredentialField({
  label,
  value,
  sensitive = false
}: {
  label: string
  value: string | null
  sensitive?: boolean
}) {
  if (!value) {
    return (
      <div>
        <div className="text-sm text-zinc-400 mb-1">{label}</div>
        <div className="text-zinc-500">No configurado</div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-sm text-zinc-400 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 p-2 rounded bg-zinc-800 text-sm font-mono truncate">
          {sensitive ? '••••••••••••••••••••' : value}
        </code>
        <Button variant="ghost" size="icon" title="Copiar">
          <Copy size={14} />
        </Button>
        {sensitive && (
          <Button variant="ghost" size="icon" title="Mostrar">
            <Eye size={14} />
          </Button>
        )}
      </div>
    </div>
  )
}
