# Auth Patterns

Patrones de autenticacion con Supabase Auth en Next.js.

## Middleware de Auth

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_EMAIL = 'fer.frias0000@gmail.com'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Portal routes
  if (request.nextUrl.pathname.startsWith('/portal')) {
    if (request.nextUrl.pathname === '/portal/login') {
      if (user) {
        return NextResponse.redirect(new URL('/portal/dashboard', request.url))
      }
      return supabaseResponse
    }

    if (!user) {
      return NextResponse.redirect(new URL('/portal/login', request.url))
    }
  }

  // Admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (request.nextUrl.pathname === '/admin/login') {
      if (user && user.email === ADMIN_EMAIL) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return supabaseResponse
    }

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return supabaseResponse
}
```

## Main Middleware

```typescript
// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Login Page

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/portal/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required disabled={loading} />
      <input name="password" type="password" required disabled={loading} />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
```

## Verificar Auth en Server Component

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  // Additional authorization check
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!client) redirect('/portal/login')

  return <div>Protected content</div>
}
```

## Logout

```typescript
// src/app/api/auth/logout/route.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/portal/login')
}
```

## DO

- Verificar auth en middleware Y en pages
- Usar `router.refresh()` despues de login
- Verificar email especifico para admin
- Manejar redirect de usuarios ya logueados

## DON'T

- NO confiar solo en middleware
- NO hardcodear passwords
- NO exponer ADMIN_EMAIL en frontend
- NO olvidar signOut en logout
