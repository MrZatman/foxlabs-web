import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

export default function NewClientPage() {
  async function createNewClient(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const name = formData.get('name') as string
    const contactName = formData.get('contact_name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const whatsapp = formData.get('whatsapp') as string
    const notes = formData.get('notes') as string
    const createPortal = formData.get('create_portal') === 'on'
    const createProject = formData.get('create_project') === 'on'
    const projectName = formData.get('project_name') as string

    // Create client
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name,
        contact_name: contactName,
        email,
        phone: phone || null,
        whatsapp: whatsapp || null,
        notes: notes || null,
        portal_enabled: createPortal
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return
    }

    // Create portal access if requested
    if (createPortal) {
      const password = Math.random().toString(36).slice(-8) + 'A1!'

      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true
        })
      })

      // Notify password via Telegram
      const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN
      const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

      if (ADMIN_BOT_TOKEN && ADMIN_CHAT_ID) {
        await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ADMIN_CHAT_ID,
            text: `<b>Nuevo cliente creado</b>\n\nCliente: ${name}\nEmail: ${email}\nPassword: <code>${password}</code>\n\nYa puede acceder al portal.`,
            parse_mode: 'HTML'
          })
        })
      }
    }

    // Create project if requested
    if (createProject && projectName) {
      await supabase.from('projects').insert({
        name: projectName,
        client_id: client.id,
        status: 'planning'
      })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      type: 'client',
      resource_type: 'client',
      resource_id: client.id,
      message: `Nuevo cliente creado: ${name}`,
      actor: 'admin'
    })

    redirect(`/admin/clients/${client.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Cliente</h1>
          <p className="text-zinc-400">Crea un nuevo cliente</p>
        </div>
      </div>

      <form action={createNewClient} className="space-y-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Datos del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre de Empresa *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  className="mt-1 bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label htmlFor="contact_name">Nombre de Contacto</Label>
                <Input
                  id="contact_name"
                  name="contact_name"
                  className="mt-1 bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  name="phone"
                  className="mt-1 bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  className="mt-1 bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                className="mt-1 bg-zinc-800 border-zinc-700"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Portal de Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox id="create_portal" name="create_portal" />
              <Label htmlFor="create_portal">
                Crear acceso al portal
                <span className="block text-sm text-zinc-500">
                  Se generara un password automaticamente
                </span>
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Proyecto Inicial (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox id="create_project" name="create_project" />
              <Label htmlFor="create_project">
                Crear proyecto inicial
              </Label>
            </div>

            <div>
              <Label htmlFor="project_name">Nombre del Proyecto</Label>
              <Input
                id="project_name"
                name="project_name"
                placeholder="Ej: App de Reservas"
                className="mt-1 bg-zinc-800 border-zinc-700"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/admin/clients">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            <Save size={16} className="mr-2" />
            Crear Cliente
          </Button>
        </div>
      </form>
    </div>
  )
}
