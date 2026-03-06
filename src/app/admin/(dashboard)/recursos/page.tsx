import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Database,
  Chrome,
  CheckCircle,
  XCircle,
  ExternalLink,
  Server,
  FolderGit2,
  Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function RecursosPage() {
  const supabase = await createClient()

  // Get chrome profiles with their supabase projects
  const { data: chromeProfiles } = await supabase
    .from('chrome_profiles')
    .select(`
      id,
      email,
      name,
      is_active,
      slots_total,
      slots_used,
      supabase_access_token,
      supabase_projects (
        id,
        name,
        supabase_ref,
        url,
        region,
        status,
        projects (
          id,
          name,
          slug,
          status,
          client_id,
          clients (
            id,
            name
          )
        )
      )
    `)
    .order('email')

  // Stats
  const totalProfiles = chromeProfiles?.length || 0
  const activeProfiles = chromeProfiles?.filter(p => p.is_active).length || 0
  const totalSupabaseProjects = chromeProfiles?.reduce((acc, p) => acc + (p.supabase_projects?.length || 0), 0) || 0
  const activeSupabaseProjects = chromeProfiles?.reduce((acc, p) =>
    acc + (p.supabase_projects?.filter((sp: { status: string }) => sp.status === 'ACTIVE_HEALTHY').length || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recursos</h1>
        <p className="text-zinc-400">Perfiles Chrome, cuentas Supabase y proyectos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Chrome className="text-blue-400" size={24} />
              <div>
                <p className="text-2xl font-bold">{activeProfiles}/{totalProfiles}</p>
                <p className="text-sm text-zinc-400">Perfiles Chrome</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="text-green-400" size={24} />
              <div>
                <p className="text-2xl font-bold">{activeSupabaseProjects}/{totalSupabaseProjects}</p>
                <p className="text-sm text-zinc-400">Supabase Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FolderGit2 className="text-orange-400" size={24} />
              <div>
                <p className="text-2xl font-bold">
                  {chromeProfiles?.reduce((acc, p) =>
                    acc + (p.supabase_projects?.reduce((a: number, sp: { projects?: unknown[] }) =>
                      a + (sp.projects?.length || 0), 0) || 0), 0) || 0}
                </p>
                <p className="text-sm text-zinc-400">Proyectos Vinculados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="text-purple-400" size={24} />
              <div>
                <p className="text-2xl font-bold">
                  {chromeProfiles?.reduce((acc, p) =>
                    acc + (p.supabase_projects?.reduce((a: number, sp: { projects?: Array<{ client_id?: string }> }) =>
                      a + (sp.projects?.filter((proj: { client_id?: string }) => proj.client_id).length || 0), 0) || 0), 0) || 0}
                </p>
                <p className="text-sm text-zinc-400">Con Cliente Asignado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chrome Profiles with hierarchy */}
      <div className="space-y-6">
        {chromeProfiles?.map((profile) => (
          <Card key={profile.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Chrome className="text-blue-400" size={24} />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {profile.name || profile.email}
                      {profile.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400">Activo</Badge>
                      ) : (
                        <Badge className="bg-zinc-500/20 text-zinc-400">Inactivo</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-zinc-400">{profile.email}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-zinc-400">
                  <p>Slots: {profile.slots_used || 0}/{profile.slots_total || 2}</p>
                  {profile.supabase_access_token && (
                    <p className="text-green-400 text-xs">Token configurado</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {profile.supabase_projects && profile.supabase_projects.length > 0 ? (
                <div className="space-y-3 mt-2">
                  {profile.supabase_projects.map((sp: {
                    id: string
                    name: string
                    supabase_ref: string
                    url?: string
                    region?: string
                    status?: string
                    projects?: Array<{
                      id: string
                      name: string
                      slug?: string
                      status?: string
                      client_id?: string
                      clients?: { id: string; name: string } | null
                    }>
                  }) => (
                    <div
                      key={sp.id}
                      className={`p-3 rounded-lg border ${
                        sp.status === 'ACTIVE_HEALTHY'
                          ? 'bg-zinc-800/50 border-zinc-700'
                          : 'bg-zinc-800/30 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Database
                            className={sp.status === 'ACTIVE_HEALTHY' ? 'text-green-400' : 'text-zinc-500'}
                            size={18}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{sp.name}</span>
                              <code className="text-xs bg-zinc-700 px-1.5 py-0.5 rounded">
                                {sp.supabase_ref}
                              </code>
                              {sp.status === 'ACTIVE_HEALTHY' ? (
                                <CheckCircle className="text-green-400" size={14} />
                              ) : (
                                <XCircle className="text-zinc-500" size={14} />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                              <Server size={12} />
                              <span>{sp.region}</span>
                              {sp.url && (
                                <a
                                  href={sp.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  Dashboard <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/admin/supabase/${sp.id}`}
                          className="text-xs text-zinc-400 hover:text-white"
                        >
                          Ver detalles
                        </Link>
                      </div>

                      {/* Linked projects */}
                      {sp.projects && sp.projects.length > 0 && (
                        <div className="mt-3 pl-7 space-y-2">
                          {sp.projects.map((proj) => (
                            <div
                              key={proj.id}
                              className="flex items-center justify-between p-2 bg-zinc-900/50 rounded border border-zinc-800"
                            >
                              <div className="flex items-center gap-2">
                                <FolderGit2 size={14} className="text-orange-400" />
                                <Link
                                  href={`/admin/projects/${proj.slug || proj.id}`}
                                  className="text-sm hover:text-orange-400"
                                >
                                  {proj.name}
                                </Link>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    proj.status === 'active'
                                      ? 'border-green-500/30 text-green-400'
                                      : 'border-zinc-700 text-zinc-400'
                                  }`}
                                >
                                  {proj.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {proj.clients ? (
                                  <Link
                                    href={`/admin/clients/${proj.client_id}`}
                                    className="flex items-center gap-1 text-xs text-purple-400 hover:underline"
                                  >
                                    <Users size={12} />
                                    {proj.clients.name}
                                  </Link>
                                ) : (
                                  <span className="text-xs text-zinc-500">Sin cliente</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No projects linked */}
                      {(!sp.projects || sp.projects.length === 0) && (
                        <div className="mt-3 pl-7">
                          <p className="text-xs text-zinc-500">
                            Sin proyectos vinculados -
                            <Link href={`/admin/projects/new`} className="text-orange-400 hover:underline ml-1">
                              Crear proyecto
                            </Link>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm mt-2">
                  Sin proyectos Supabase -
                  <Link href="/admin/supabase/new" className="text-green-400 hover:underline ml-1">
                    Agregar
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
