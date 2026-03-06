import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  FileText,
  Download,
  UserPlus,
  Save
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  quoted: 'bg-purple-500/20 text-purple-400',
  negotiating: 'bg-orange-500/20 text-orange-400',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400'
}

export default async function LeadDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !lead) {
    notFound()
  }

  // Get attachments
  const { data: attachments } = await supabase
    .from('lead_attachments')
    .select('*')
    .eq('lead_id', id)

  // Get activity history
  const { data: history } = await supabase
    .from('activity_log')
    .select('*')
    .eq('resource_type', 'lead')
    .eq('resource_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  async function updateLead(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const updates = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      company: formData.get('company') as string,
      status: formData.get('status') as string,
      notes: formData.get('notes') as string,
      quotation: formData.get('quotation') as string,
      follow_up_date: formData.get('follow_up_date') as string || null,
      updated_at: new Date().toISOString()
    }

    await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)

    // Log activity
    await supabase.from('activity_log').insert({
      type: 'lead',
      resource_type: 'lead',
      resource_id: id,
      message: `Lead actualizado: ${updates.name}`,
      actor: 'admin'
    })

    redirect(`/admin/leads/${id}`)
  }

  async function convertToClient(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const projectName = formData.get('project_name') as string
    const password = Math.random().toString(36).slice(-8) + 'A1!'

    // Create client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: lead.company || lead.name,
        contact_name: lead.name,
        email: lead.email,
        phone: lead.phone,
        notes: `Convertido desde lead #${lead.lead_number}`
      })
      .select()
      .single()

    if (clientError) {
      console.error('Error creating client:', clientError)
      return
    }

    // Create auth user for portal
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: lead.email,
        password: password,
        email_confirm: true
      })
    })

    // Create project if requested
    if (projectName) {
      await supabase.from('projects').insert({
        name: projectName,
        client_id: client.id,
        status: 'planning',
        description: lead.description
      })
    }

    // Update lead status
    await supabase
      .from('leads')
      .update({
        status: 'won',
        converted_to_client_id: client.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    // Log activity
    await supabase.from('activity_log').insert({
      type: 'client',
      resource_type: 'client',
      resource_id: client.id,
      message: `Cliente creado desde lead: ${lead.name}`,
      actor: 'admin'
    })

    // Notify via Telegram
    const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN
    const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

    if (ADMIN_BOT_TOKEN && ADMIN_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: `<b>Lead convertido a cliente</b>\n\nCliente: ${client.name}\nEmail: ${lead.email}\nPassword: <code>${password}</code>\n\nYa puede acceder al portal.`,
          parse_mode: 'HTML'
        })
      })
    }

    redirect(`/admin/clients/${client.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Lead #{lead.lead_number}</h1>
          <p className="text-zinc-400">{lead.name}</p>
        </div>
        <Badge className={statusColors[lead.status] || 'bg-zinc-700'}>
          {lead.status}
        </Badge>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="info">Informacion</TabsTrigger>
          <TabsTrigger value="project">Proyecto</TabsTrigger>
          <TabsTrigger value="followup">Seguimiento</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <form action={updateLead}>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Datos de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={lead.name}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={lead.email}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={lead.phone || ''}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      name="company"
                      defaultValue={lead.company || ''}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={lead.status}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="new">Nuevo</option>
                    <option value="contacted">Contactado</option>
                    <option value="quoted">Cotizado</option>
                    <option value="negotiating">Negociando</option>
                    <option value="won">Ganado</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    <Save size={16} className="mr-2" />
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="project">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Informacion del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Proyecto</Label>
                  <p className="mt-1 text-zinc-300">{lead.project_type || 'No especificado'}</p>
                </div>
                <div>
                  <Label>Presupuesto</Label>
                  <p className="mt-1 text-zinc-300">{lead.budget || 'No especificado'}</p>
                </div>
                <div>
                  <Label>Timeline</Label>
                  <p className="mt-1 text-zinc-300">{lead.timeline || 'No especificado'}</p>
                </div>
                <div>
                  <Label>Fuente</Label>
                  <p className="mt-1 text-zinc-300">{lead.source || 'web'} {lead.source_details && `(${lead.source_details})`}</p>
                </div>
              </div>

              {lead.features && lead.features.length > 0 && (
                <div>
                  <Label>Features Solicitadas</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lead.features.map((feature: string, i: number) => (
                      <Badge key={i} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Descripcion</Label>
                <p className="mt-1 text-zinc-300 whitespace-pre-wrap">{lead.description || 'Sin descripcion'}</p>
              </div>

              {attachments && attachments.length > 0 && (
                <div>
                  <Label>Archivos Adjuntos</Label>
                  <div className="mt-2 space-y-2">
                    {attachments.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                      >
                        <FileText size={16} />
                        <span className="flex-1">{file.name}</span>
                        <Download size={16} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followup">
          <div className="grid md:grid-cols-2 gap-6">
            <form action={updateLead}>
              <input type="hidden" name="name" value={lead.name} />
              <input type="hidden" name="email" value={lead.email} />
              <input type="hidden" name="phone" value={lead.phone || ''} />
              <input type="hidden" name="company" value={lead.company || ''} />
              <input type="hidden" name="status" value={lead.status} />

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Seguimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="quotation">Tu Cotizacion</Label>
                    <Textarea
                      id="quotation"
                      name="quotation"
                      defaultValue={lead.quotation || ''}
                      placeholder="Escribe tu cotizacion aqui..."
                      className="mt-1 bg-zinc-800 border-zinc-700 min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas Internas</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      defaultValue={lead.notes || ''}
                      placeholder="Notas para ti..."
                      className="mt-1 bg-zinc-800 border-zinc-700 min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="follow_up_date">Fecha de Follow-up</Label>
                    <Input
                      id="follow_up_date"
                      name="follow_up_date"
                      type="date"
                      defaultValue={lead.follow_up_date?.split('T')[0] || ''}
                      className="mt-1 bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                    <Save size={16} className="mr-2" />
                    Guardar
                  </Button>
                </CardContent>
              </Card>
            </form>

            {lead.status !== 'won' && lead.status !== 'lost' && (
              <form action={convertToClient}>
                <Card className="bg-zinc-900 border-zinc-800 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-400">Convertir a Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-zinc-400">
                      Esto creara un cliente y le dara acceso al portal.
                    </p>

                    <div>
                      <Label htmlFor="project_name">Nombre del Proyecto (opcional)</Label>
                      <Input
                        id="project_name"
                        name="project_name"
                        placeholder="Ej: App de Reservas"
                        className="mt-1 bg-zinc-800 border-zinc-700"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                      <UserPlus size={16} className="mr-2" />
                      Convertir a Cliente
                    </Button>
                  </CardContent>
                </Card>
              </form>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Historial de Cambios</CardTitle>
            </CardHeader>
            <CardContent>
              {!history || history.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Sin historial</p>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-2 h-2 mt-2 rounded-full bg-zinc-600" />
                      <div className="flex-1">
                        <p className="text-sm">{item.message}</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(item.created_at).toLocaleString('es-MX')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
