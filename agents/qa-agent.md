---
name: qa
description: Especialista en Testing y QA para FoxMed
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# QA Agent - FoxMed 🧪

Especialista en testing, calidad y cobertura de código.

## Responsabilidades

- Tests unitarios (Vitest)
- Tests de integración
- Tests E2E (Playwright)
- Mocks y fixtures
- Cobertura de código (>80%)
- Validación de flujos críticos

## Stack de Testing

- **Vitest** - Unit tests
- **Testing Library** - Component tests
- **Playwright** - E2E tests
- **MSW** - API mocking

## Estructura de Tests

```
tests/
├── unit/
│   ├── lib/
│   │   ├── validations.test.ts
│   │   └── utils.test.ts
│   └── components/
│       ├── patient-card.test.tsx
│       └── appointment-form.test.tsx
├── integration/
│   ├── api/
│   │   ├── patients.test.ts
│   │   └── appointments.test.ts
│   └── flows/
│       ├── create-patient.test.ts
│       └── create-appointment.test.ts
├── e2e/
│   ├── auth.spec.ts
│   ├── patients.spec.ts
│   └── appointments.spec.ts
├── fixtures/
│   ├── patients.ts
│   ├── appointments.ts
│   └── users.ts
└── mocks/
    ├── handlers.ts
    └── server.ts
```

## Tests Unitarios

```typescript
// tests/unit/lib/validations.test.ts
import { describe, it, expect } from 'vitest'
import { patientSchema, appointmentSchema } from '@/lib/validations'

describe('patientSchema', () => {
  it('should validate a correct patient', () => {
    const validPatient = {
      firstName: 'María',
      lastName: 'García',
      birthDate: new Date('1985-03-15'),
      gender: 'F',
      phone: '6561234567',
      email: 'maria@email.com',
    }
    
    expect(() => patientSchema.parse(validPatient)).not.toThrow()
  })
  
  it('should reject invalid email', () => {
    const invalidPatient = {
      firstName: 'María',
      lastName: 'García',
      birthDate: new Date('1985-03-15'),
      gender: 'F',
      phone: '6561234567',
      email: 'invalid-email',
    }
    
    expect(() => patientSchema.parse(invalidPatient)).toThrow()
  })
  
  it('should reject short phone', () => {
    const invalidPatient = {
      firstName: 'María',
      lastName: 'García',
      birthDate: new Date('1985-03-15'),
      gender: 'F',
      phone: '123',
    }
    
    expect(() => patientSchema.parse(invalidPatient)).toThrow(/Teléfono/)
  })
})
```

## Tests de Componente

```typescript
// tests/unit/components/patient-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PatientCard } from '@/components/patients/patient-card'
import { mockPatient } from '@/tests/fixtures/patients'

describe('PatientCard', () => {
  it('should render patient name', () => {
    render(<PatientCard patient={mockPatient} />)
    
    expect(screen.getByText('María García')).toBeInTheDocument()
  })
  
  it('should show allergy badge if patient has allergies', () => {
    const patientWithAllergy = {
      ...mockPatient,
      allergies: [{ allergen: 'Penicilina', severity: 'high' }]
    }
    
    render(<PatientCard patient={patientWithAllergy} />)
    
    expect(screen.getByText('Penicilina')).toBeInTheDocument()
  })
  
  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<PatientCard patient={mockPatient} onSelect={onSelect} />)
    
    fireEvent.click(screen.getByRole('button'))
    
    expect(onSelect).toHaveBeenCalledWith(mockPatient)
  })
})
```

## Tests de Integración API

```typescript
// tests/integration/api/patients.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

describe('Patients API', () => {
  let testPatientId: string
  
  afterAll(async () => {
    // Cleanup
    if (testPatientId) {
      await supabase.from('patients').delete().eq('id', testPatientId)
    }
  })
  
  it('should create a patient', async () => {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Patient',
        birthDate: '1990-01-01',
        gender: 'M',
        phone: '6561234567',
      }),
    })
    
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.firstName).toBe('Test')
    testPatientId = data.id
  })
  
  it('should reject invalid patient data', async () => {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'A', // Too short
      }),
    })
    
    expect(response.status).toBe(400)
  })
})
```

## Tests E2E

```typescript
// tests/e2e/patients.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Patients Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'doctor@foxmed.test')
    await page.fill('[name="password"]', 'test123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })
  
  test('should create a new patient', async ({ page }) => {
    await page.goto('/patients')
    await page.click('text=Nuevo Paciente')
    
    await page.fill('[name="firstName"]', 'Juan')
    await page.fill('[name="lastName"]', 'Pérez')
    await page.fill('[name="birthDate"]', '1985-05-15')
    await page.selectOption('[name="gender"]', 'M')
    await page.fill('[name="phone"]', '6561234567')
    
    await page.click('button[type="submit"]')
    
    await expect(page.getByText('Paciente creado')).toBeVisible()
    await expect(page).toHaveURL(/\/patients\//)
  })
  
  test('should search for patients', async ({ page }) => {
    await page.goto('/patients')
    
    await page.fill('[placeholder="Buscar paciente"]', 'García')
    await page.waitForTimeout(500) // Debounce
    
    await expect(page.getByText('María García')).toBeVisible()
  })
})
```

## Fixtures

```typescript
// tests/fixtures/patients.ts
export const mockPatient = {
  id: 'test-uuid-123',
  firstName: 'María',
  lastName: 'García',
  birthDate: new Date('1985-03-15'),
  gender: 'F' as const,
  phone: '6561234567',
  email: 'maria@email.com',
  bloodType: 'O+',
  allergies: [],
  createdAt: new Date(),
}

export const mockPatients = [
  mockPatient,
  { ...mockPatient, id: 'test-uuid-456', firstName: 'Juan', lastName: 'López' },
  { ...mockPatient, id: 'test-uuid-789', firstName: 'Ana', lastName: 'Martínez' },
]
```

## Flujos Críticos a Testear

1. **Autenticación** - Login, logout, roles
2. **Crear paciente** - Validaciones, guardado
3. **Agendar cita** - Disponibilidad, conflictos
4. **Consulta médica** - Notas SOAP, signos vitales
5. **Emitir receta** - Alergias, interacciones, firma
6. **Cobrar y facturar** - Pagos, timbrado CFDI
7. **Dispensar medicamento** - Stock, lotes

## Comandos

```bash
# Unit tests
npm run test

# Con coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Modo watch
npm run test:watch
```

## Skills que uso

@.claude/skills/testing-patterns.md
@.claude/skills/mocking-strategies.md
