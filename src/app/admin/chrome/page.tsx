import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, RefreshCw, Eye, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default async function ChromeProfilesPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('chrome_profiles')
    .select(`
      *,
      supabase_projects:supabase_projects(count),
      projects:projects(count)
    `)
    .order('email')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Perfiles Chrome</h1>
          <p className="text-zinc-400">Gestiona tus cuentas de Google/Supabase</p>
        </div>
        <Link href="/admin/chrome/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus size={16} className="mr-2" />
            Nuevo Perfil
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!profiles || profiles.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 col-span-full">
            <CardContent className="p-8 text-center text-zinc-500">
              No hay perfiles configurados
            </CardContent>
          </Card>
        ) : (
          profiles.map((profile) => {
            const slotsUsed = (profile.supabase_projects as { count: number }[])?.[0]?.count || 0
            const slotsTotal = profile.slots_total || 2
            const slotsPercent = (slotsUsed / slotsTotal) * 100
            const projectsCount = (profile.projects as { count: number }[])?.[0]?.count || 0

            const isTokenValid = profile.token_expires_at
              ? new Date(profile.token_expires_at) > new Date()
              : true

            const statusColor = !isTokenValid
              ? 'border-red-500/50'
              : slotsPercent >= 100
                ? 'border-red-500/50'
                : slotsPercent >= 80
                  ? 'border-yellow-500/50'
                  : 'border-green-500/50'

            return (
              <Card key={profile.id} className={`bg-zinc-900 border-zinc-800 ${statusColor}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{profile.name || profile.email}</CardTitle>
                      <p className="text-sm text-zinc-400">{profile.email}</p>
                    </div>
                    {isTokenValid ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <AlertCircle size={18} className="text-red-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Slots */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">Slots Supabase</span>
                      <span>{slotsUsed}/{slotsTotal}</span>
                    </div>
                    <Progress
                      value={slotsPercent}
                      className={`h-2 ${
                        slotsPercent >= 100 ? '[&>div]:bg-red-500' :
                        slotsPercent >= 80 ? '[&>div]:bg-yellow-500' :
                        '[&>div]:bg-green-500'
                      }`}
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-zinc-800 text-center">
                      <div className="text-lg font-bold">{slotsUsed}</div>
                      <div className="text-xs text-zinc-500">Supabase</div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-800 text-center">
                      <div className="text-lg font-bold">{projectsCount}</div>
                      <div className="text-xs text-zinc-500">Proyectos</div>
                    </div>
                  </div>

                  {/* Token Status */}
                  {!isTokenValid && (
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                      <div className="text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle size={14} />
                        Token expirado
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/admin/chrome/${profile.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye size={16} className="mr-2" />
                        Ver
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon">
                      <RefreshCw size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
