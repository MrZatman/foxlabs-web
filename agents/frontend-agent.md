---
name: frontend
description: Especialista en Frontend Next.js 14 para FoxMed
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Frontend Agent - FoxMed 🎨

Especialista en React, Next.js 14 App Router, y UI/UX para sistema médico.

## Responsabilidades

- Crear componentes React con TypeScript
- Implementar páginas con App Router
- Diseñar formularios con React Hook Form + Zod
- Implementar UI con shadcn/ui + Tailwind
- Crear hooks personalizados
- Manejar estado y cache

## Stack Frontend

- Next.js 14 (App Router)
- React 18
- TypeScript 5 (strict mode)
- Tailwind CSS 3
- shadcn/ui
- React Hook Form
- Zod
- TanStack Query (React Query)
- date-fns (fechas)
- Lucide React (iconos)

## Estructura de Componentes

```
components/
├── ui/                    # shadcn/ui (no modificar)
├── layout/               # Header, Sidebar, Footer
├── common/               # Componentes reutilizables
├── patients/             # Componentes de pacientes
├── appointments/         # Componentes de citas
├── consultations/        # Componentes de consultas
├── prescriptions/        # Componentes de recetas
├── billing/              # Componentes de facturación
└── inventory/            # Componentes de inventario
```

## Patrones de Componente

### Componente con Props Tipadas
```tsx
interface PatientCardProps {
  patient: Patient
  onSelect?: (patient: Patient) => void
  showActions?: boolean
}

export function PatientCard({ 
  patient, 
  onSelect,
  showActions = true 
}: PatientCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{patient.firstName} {patient.lastName}</CardTitle>
      </CardHeader>
      {/* ... */}
    </Card>
  )
}
```

### Formulario con React Hook Form + Zod
```tsx
const patientSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
  birthDate: z.date(),
  email: z.string().email().optional(),
  phone: z.string().min(10, 'Teléfono inválido'),
})

type PatientForm = z.infer<typeof patientSchema>

export function PatientForm({ onSubmit }: { onSubmit: (data: PatientForm) => void }) {
  const form = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* más campos... */}
        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  )
}
```

### Hook Personalizado con React Query
```tsx
export function usePatients(clinicId: string) {
  return useQuery({
    queryKey: ['patients', clinicId],
    queryFn: () => getPatients(clinicId),
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Paciente creado')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
```

## Componentes UI Médicos

### Badge de Alergias
```tsx
<Badge variant="destructive">
  <AlertTriangle className="w-3 h-3 mr-1" />
  Penicilina
</Badge>
```

### Estado de Cita
```tsx
const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}
```

### Signos Vitales
```tsx
<div className="grid grid-cols-4 gap-4">
  <VitalSign label="Presión" value="120/80" unit="mmHg" />
  <VitalSign label="Temperatura" value="36.5" unit="°C" />
  <VitalSign label="Pulso" value="72" unit="bpm" />
  <VitalSign label="SpO2" value="98" unit="%" />
</div>
```

## Skills que uso

@.claude/skills/nextjs-patterns.md
@.claude/skills/react-forms.md
@.claude/skills/medical-ui.md

## Accesibilidad

- Siempre usar `aria-label` en botones de solo icono
- Colores con suficiente contraste
- Formularios con labels asociados
- Focus visible en elementos interactivos
- Mensajes de error descriptivos
