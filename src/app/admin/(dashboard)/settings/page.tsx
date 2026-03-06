import { createClient } from '@/lib/supabase/server'
import { Save, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Get current settings
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .single()

  // Test Telegram connection
  const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN
  const telegramConnected = !!ADMIN_BOT_TOKEN

  async function saveSettings(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const newSettings = {
      system_name: formData.get('system_name') as string,
      notification_email: formData.get('notification_email') as string,
      timezone: formData.get('timezone') as string,
      projects_base_path: formData.get('projects_base_path') as string,
      notify_new_lead: formData.get('notify_new_lead') === 'on',
      notify_new_request: formData.get('notify_new_request') === 'on',
      notify_request_completed: formData.get('notify_request_completed') === 'on',
      notify_deploy: formData.get('notify_deploy') === 'on',
      updated_at: new Date().toISOString()
    }

    const { data: existing } = await supabase.from('settings').select('id').single()

    if (existing) {
      await supabase.from('settings').update(newSettings).eq('id', existing.id)
    } else {
      await supabase.from('settings').insert(newSettings)
    }

    redirect('/admin/settings')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-zinc-400">Configuracion del sistema</p>
      </div>

      <form action={saveSettings} className="space-y-6">
        {/* General */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Configuracion basica del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="system_name">Nombre del Sistema</Label>
                <Input
                  id="system_name"
                  name="system_name"
                  defaultValue={settings?.system_name || 'FoxLabs'}
                  className="mt-1 bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label htmlFor="notification_email">Email de Notificaciones</Label>
                <Input
                  id="notification_email"
                  name="notification_email"
                  type="email"
                  defaultValue={settings?.notification_email || ''}
                  className="mt-1 bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  name="timezone"
                  defaultValue={settings?.timezone || 'America/Mexico_City'}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                >
                  <option value="America/Mexico_City">Mexico City (GMT-6)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
                  <option value="Europe/Madrid">Madrid (GMT+1)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Telegram
              {telegramConnected ? (
                <CheckCircle size={18} className="text-green-500" />
              ) : (
                <AlertTriangle size={18} className="text-yellow-500" />
              )}
            </CardTitle>
            <CardDescription>Configuracion de bots de Telegram</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-zinc-800/50">
                <div className="text-sm text-zinc-400 mb-1">Bot Admin</div>
                <div className="font-mono text-sm">@FoxOrchestrator_bot</div>
                <div className={`text-xs mt-1 ${telegramConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {telegramConnected ? 'Conectado' : 'No configurado'}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-zinc-800/50">
                <div className="text-sm text-zinc-400 mb-1">Bot Publico</div>
                <div className="font-mono text-sm">@FoxLabsDev_bot</div>
                <div className="text-xs mt-1 text-green-400">Conectado</div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-800/50">
              <div className="text-sm text-zinc-400 mb-1">Admin Chat ID</div>
              <div className="font-mono">{process.env.TELEGRAM_ADMIN_CHAT_ID || 'No configurado'}</div>
            </div>

            <Button type="button" variant="outline">
              <RefreshCw size={16} className="mr-2" />
              Test Conexion
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>Que notificar por Telegram</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify_new_lead"
                  name="notify_new_lead"
                  defaultChecked={settings?.notify_new_lead !== false}
                />
                <Label htmlFor="notify_new_lead">Nuevos leads</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify_new_request"
                  name="notify_new_request"
                  defaultChecked={settings?.notify_new_request !== false}
                />
                <Label htmlFor="notify_new_request">Nuevos requests</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify_request_completed"
                  name="notify_request_completed"
                  defaultChecked={settings?.notify_request_completed !== false}
                />
                <Label htmlFor="notify_request_completed">Requests completados</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify_deploy"
                  name="notify_deploy"
                  defaultChecked={settings?.notify_deploy !== false}
                />
                <Label htmlFor="notify_deploy">Deploys</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paths */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Rutas</CardTitle>
            <CardDescription>Configuracion de carpetas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="projects_base_path">Carpeta Base de Proyectos</Label>
              <Input
                id="projects_base_path"
                name="projects_base_path"
                defaultValue={settings?.projects_base_path || 'D:/FoxlabsProjects'}
                className="mt-1 bg-zinc-800 border-zinc-700"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Donde se crean los proyectos localmente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-zinc-900 border-zinc-800 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-400">Zona de Peligro</CardTitle>
            <CardDescription>Acciones que pueden afectar el sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
              <div>
                <div className="font-medium">Limpiar cache</div>
                <div className="text-sm text-zinc-400">Elimina datos temporales</div>
              </div>
              <Button type="button" variant="outline" size="sm">
                Limpiar
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
              <div>
                <div className="font-medium">Re-sincronizar con Supabase</div>
                <div className="text-sm text-zinc-400">Actualiza datos desde la base de datos</div>
              </div>
              <Button type="button" variant="outline" size="sm">
                Sincronizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            <Save size={16} className="mr-2" />
            Guardar Configuracion
          </Button>
        </div>
      </form>
    </div>
  )
}
