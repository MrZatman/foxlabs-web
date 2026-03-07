---
name: patients
description: Especialista en Expediente Clínico Electrónico para FoxMed
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Patients Agent - FoxMed 📋

Especialista en gestión de expedientes clínicos y datos de pacientes.

## Responsabilidades

- Gestión de datos de pacientes
- Historia clínica completa
- Antecedentes médicos
- Notas de consulta (SOAP)
- Alergias y medicamentos
- Archivos y estudios
- Cumplimiento NOM-024-SSA3

## Estructura de Expediente Clínico

### Datos del Paciente
```typescript
interface Patient {
  id: string
  clinicId: string
  
  // Datos personales
  firstName: string
  lastName: string
  birthDate: Date
  gender: 'M' | 'F' | 'O'
  
  // Contacto
  email?: string
  phone: string
  address?: string
  
  // Médico
  bloodType?: string
  
  // Emergencia
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  
  // Identificación (México)
  curp?: string
  rfc?: string
}
```

### Antecedentes
```typescript
interface PatientHistory {
  id: string
  patientId: string
  type: 
    | 'heredofamiliar'      // Antecedentes familiares
    | 'personal_patologico' // Enfermedades previas
    | 'personal_no_patologico' // Hábitos, estilo de vida
    | 'gineco_obstetrico'   // Mujeres
    | 'quirurgico'          // Cirugías previas
    | 'alergico'            // Alergias
    | 'traumatico'          // Accidentes, fracturas
  description: string
  dateReported: Date
}
```

### Consulta (Formato SOAP)
```typescript
interface Consultation {
  id: string
  appointmentId: string
  patientId: string
  doctorId: string
  
  // SOAP
  chiefComplaint: string  // Motivo de consulta
  subjective: string      // Lo que el paciente refiere
  objective: string       // Exploración física, signos
  assessment: string      // Diagnóstico/Impresión
  plan: string           // Plan de tratamiento
  
  // Relacionados
  vitalSigns: VitalSigns
  diagnoses: Diagnosis[]  // CIE-10
  prescriptions: Prescription[]
  
  createdAt: Date
}
```

### Signos Vitales
```typescript
interface VitalSigns {
  id: string
  consultationId: string
  patientId: string
  
  weight?: number         // kg
  height?: number         // cm
  temperature?: number    // °C
  bloodPressureSystolic?: number   // mmHg
  bloodPressureDiastolic?: number  // mmHg
  heartRate?: number      // bpm
  respiratoryRate?: number // rpm
  oxygenSaturation?: number // %
  
  notes?: string
  measuredAt: Date
}
```

## Componentes de Expediente

### Timeline de Consultas
```tsx
<PatientTimeline patientId={id}>
  {consultations.map(consultation => (
    <TimelineItem
      key={consultation.id}
      date={consultation.createdAt}
      doctor={consultation.doctor}
      diagnosis={consultation.diagnoses}
    />
  ))}
</PatientTimeline>
```

### Panel de Alergias
```tsx
<AlertCard variant="destructive">
  <AlertTitle>Alergias</AlertTitle>
  <AlertDescription>
    <ul>
      {allergies.map(allergy => (
        <li key={allergy.id}>
          {allergy.allergen} - {allergy.reaction}
        </li>
      ))}
    </ul>
  </AlertDescription>
</AlertCard>
```

### Formulario SOAP
```tsx
<SOAPForm onSubmit={handleConsultation}>
  <SOAPSection title="S - Subjetivo">
    <Textarea name="subjective" placeholder="Lo que el paciente refiere..." />
  </SOAPSection>
  <SOAPSection title="O - Objetivo">
    <VitalSignsInput />
    <Textarea name="objective" placeholder="Exploración física..." />
  </SOAPSection>
  <SOAPSection title="A - Análisis">
    <DiagnosisSearch name="diagnoses" />
    <Textarea name="assessment" placeholder="Impresión diagnóstica..." />
  </SOAPSection>
  <SOAPSection title="P - Plan">
    <Textarea name="plan" placeholder="Plan de tratamiento..." />
    <PrescriptionBuilder />
  </SOAPSection>
</SOAPForm>
```

## Validaciones Zod

```typescript
export const patientCreateSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  birthDate: z.coerce.date(),
  gender: z.enum(['M', 'F', 'O']),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional().or(z.literal('')),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  curp: z.string().length(18).optional(),
  emergencyContact: z.object({
    name: z.string().min(2),
    relationship: z.string().min(2),
    phone: z.string().min(10),
  }),
})

export const consultationSchema = z.object({
  chiefComplaint: z.string().min(5),
  subjective: z.string().min(10),
  objective: z.string().min(10),
  assessment: z.string().min(10),
  plan: z.string().min(10),
  diagnoses: z.array(z.string().uuid()).min(1),
})
```

## NOM-024-SSA3 Compliance

- ✅ Identificación única del paciente
- ✅ Registro de todas las consultas
- ✅ Notas con fecha, hora y responsable
- ✅ Diagnósticos con CIE-10
- ✅ Firma electrónica del médico
- ✅ Trazabilidad de cambios
- ✅ Consentimiento informado

## Skills que uso

@.claude/skills/medical-records.md
@.claude/skills/cie10-catalog.md
@.claude/skills/medical-ui.md
