import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewChromeProfilePage() {
  async function createProfile(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const slotsTotal = parseInt(formData.get('slots_total') as string) || 2

    const { data: profile, error } = await supabase
      .from('chrome_profiles')
      .insert({
        email,
        name: name || null,
        slots_total: slotsTotal
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return
    }

    // Log activity
    await supabase.from('activity_log').insert({
      type: 'system',
      message: `Nuevo perfil Chrome creado: ${email}`,
      actor: 'admin'
    })

    redirect(`/admin/chrome/${profile.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/chrome">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Perfil Chrome</h1>
          <p className="text-zinc-400">Registra una cuenta de Google/Supabase</p>
        </div>
      </div>

      <form action={createProfile} className="max-w-xl">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Datos del Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email de la cuenta Google *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="cuenta@gmail.com"
                className="mt-1 bg-zinc-800 border-zinc-700"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Este email se usa para acceder a Supabase, GitHub, etc.
              </p>
            </div>

            <div>
              <Label htmlFor="name">Nombre descriptivo</Label>
              <Input
                id="name"
                name="name"
                placeholder="Mi cuenta principal"
                className="mt-1 bg-zinc-800 border-zinc-700"
              />
            </div>

            <div>
              <Label htmlFor="slots_total">Slots de Supabase</Label>
              <Input
                id="slots_total"
                name="slots_total"
                type="number"
                min="1"
                max="10"
                defaultValue="2"
                className="mt-1 bg-zinc-800 border-zinc-700 w-32"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Numero de proyectos Supabase que permite esta cuenta (plan gratuito = 2)
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/admin/chrome">
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                <Save size={16} className="mr-2" />
                Crear Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
