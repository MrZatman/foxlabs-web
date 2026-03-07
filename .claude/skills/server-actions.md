# Server Actions

Acciones del servidor en Next.js 15 para formularios y mutaciones.

## Form Action Basica

```tsx
// app/portal/requests/new/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function createRequest(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('requests').insert({
    project_id: formData.get('projectId') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    type: formData.get('type') as string,
    priority: formData.get('priority') as string
  })

  if (error) throw error

  redirect('/portal/dashboard')
}

export default function NewRequestPage() {
  return (
    <form action={createRequest}>
      <input name="projectId" type="hidden" value="..." />
      <input name="title" required />
      <textarea name="description" />
      <select name="type">
        <option value="feature">Feature</option>
        <option value="bug">Bug</option>
      </select>
      <button type="submit">Crear</button>
    </form>
  )
}
```

## Revalidar Datos

```tsx
import { revalidatePath } from 'next/cache'

async function updateClient(formData: FormData) {
  'use server'

  const supabase = await createClient()

  await supabase
    .from('clients')
    .update({ name: formData.get('name') as string })
    .eq('id', formData.get('id') as string)

  revalidatePath('/admin/clients')
}
```

## Con useActionState (React 19)

```tsx
'use client'

import { useActionState } from 'react'

async function submitLead(prevState: any, formData: FormData) {
  'use server'

  const supabase = await createClient()

  const { error } = await supabase.from('leads').insert({
    name: formData.get('name'),
    email: formData.get('email'),
    company: formData.get('company')
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export function LeadForm() {
  const [state, action, pending] = useActionState(submitLead, null)

  return (
    <form action={action}>
      <input name="name" required disabled={pending} />
      <input name="email" type="email" required disabled={pending} />
      <button type="submit" disabled={pending}>
        {pending ? 'Enviando...' : 'Enviar'}
      </button>

      {state?.error && (
        <p className="text-red-500">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-green-500">Enviado!</p>
      )}
    </form>
  )
}
```

## Logout Action

```tsx
// app/api/auth/logout/route.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/portal/login')
}
```

## DO

- Usar `'use server'` al inicio de la funcion
- Validar auth al inicio de cada action
- Usar `revalidatePath()` despues de mutaciones
- Manejar errores y retornar estado

## DON'T

- NO confiar en datos del cliente sin validar
- NO olvidar `await` en operaciones async
- NO exponer datos sensibles en errores
- NO usar server actions para reads (usar Server Components)
