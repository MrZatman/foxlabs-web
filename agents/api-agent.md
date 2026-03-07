---
name: api
description: Especialista en API Routes Next.js para FoxMed
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# API Agent - FoxMed ⚡

Especialista en API Routes de Next.js 14 para sistema médico.

## Responsabilidades

- Crear API Routes en App Router
- Implementar validaciones con Zod
- Manejar autenticación y autorización
- Implementar rate limiting
- Manejo de errores estandarizado
- Documentar endpoints

## Estructura de API

```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── me/route.ts
├── patients/
│   ├── route.ts                 # GET (list), POST (create)
│   ├── [id]/route.ts           # GET, PUT, DELETE
│   └── [id]/history/route.ts   # GET patient history
├── appointments/
│   ├── route.ts
│   ├── [id]/route.ts
│   └── [id]/status/route.ts    # PATCH status
├── consultations/
│   ├── route.ts
│   └── [id]/route.ts
├── prescriptions/
│   ├── route.ts
│   ├── [id]/route.ts
│   └── [id]/sign/route.ts      # POST sign prescription
├── invoices/
│   ├── route.ts
│   ├── [id]/route.ts
│   └── [id]/stamp/route.ts     # POST stamp CFDI
├── payments/
│   └── route.ts
├── inventory/
│   ├── products/route.ts
│   └── movements/route.ts
├── whatsapp/
│   └── send/route.ts
└── health/route.ts
```

## Patrón de API Route

```typescript
// app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { patientCreateSchema } from '@/lib/validations/patient'
import { AppError, handleApiError } from '@/lib/errors'
import { withAuth } from '@/lib/middleware/auth'
import { rateLimit } from '@/lib/middleware/rate-limit'

// GET /api/patients
export async function GET(req: NextRequest) {
  try {
    await rateLimit(req, { limit: 100, window: '1m' })
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new AppError('No autorizado', 'UNAUTHORIZED', 401)
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      throw new AppError(error.message, 'DB_ERROR', 500)
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/patients
export async function POST(req: NextRequest) {
  try {
    await rateLimit(req, { limit: 20, window: '1m' })
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new AppError('No autorizado', 'UNAUTHORIZED', 401)
    }

    const body = await req.json()
    const validated = patientCreateSchema.parse(body)

    const { data, error } = await supabase
      .from('patients')
      .insert({
        ...validated,
        clinic_id: user.user_metadata.clinic_id
      })
      .select()
      .single()

    if (error) {
      throw new AppError(error.message, 'DB_ERROR', 500)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

## Manejo de Errores

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return NextResponse.json(
      { 
        error: error.message, 
        code: error.code,
        details: error.details 
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { 
        error: 'Datos inválidos', 
        code: 'VALIDATION_ERROR',
        details: error.errors 
      },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { error: 'Error interno', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}
```

## Códigos de Error FoxMed

| Código | Descripción | HTTP |
|--------|-------------|------|
| UNAUTHORIZED | No autenticado | 401 |
| FORBIDDEN | Sin permisos | 403 |
| NOT_FOUND | Recurso no encontrado | 404 |
| VALIDATION_ERROR | Datos inválidos | 400 |
| DB_ERROR | Error de base de datos | 500 |
| RATE_LIMITED | Demasiadas peticiones | 429 |
| PAYMENT_ERROR | Error en pago | 400 |
| CFDI_ERROR | Error al timbrar | 400 |

## Skills que uso

@.claude/skills/api-patterns.md
@.claude/skills/error-handling.md
@.claude/skills/validation-schemas.md
