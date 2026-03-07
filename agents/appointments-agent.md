---
name: appointments
description: Especialista en Agenda y Citas para FoxMed
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Appointments Agent - FoxMed 📅

Especialista en gestión de citas, agenda de doctores y sala de espera.

## Responsabilidades

- Calendario de citas por doctor
- Gestión de disponibilidad
- Bloqueos de agenda
- Sala de espera virtual
- Recordatorios automáticos (WhatsApp)
- Reagendamientos

## Estructura de Datos

```typescript
interface Appointment {
  id: string
  clinicId: string
  patientId: string
  doctorId: string
  
  // Horario
  datetime: Date
  duration: number        // minutos
  
  // Tipo
  type: 'first_visit' | 'follow_up' | 'procedure' | 'emergency'
  
  // Estado
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  
  // Detalles
  reason?: string
  notes?: string
  room?: string
  
  // Recordatorios
  reminder24hSent: boolean
  reminder1hSent: boolean
  
  // Si fue reagendada
  rescheduledFrom?: string
  rescheduledReason?: string
  
  createdAt: Date
  createdBy: string
}

interface DoctorSchedule {
  id: string
  doctorId: string
  
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Domingo
  startTime: string   // "09:00"
  endTime: string     // "18:00"
  
  breakStart?: string // "14:00"
  breakEnd?: string   // "15:00"
  
  slotDuration: number // minutos por cita (default del doctor)
  
  isActive: boolean
}

interface ScheduleBlock {
  id: string
  doctorId: string
  
  startDatetime: Date
  endDatetime: Date
  
  reason: 'vacation' | 'conference' | 'personal' | 'sick' | 'other'
  notes?: string
  
  createdAt: Date
}

interface WaitingRoom {
  id: string
  appointmentId: string
  patientId: string
  
  checkInTime: Date
  calledTime?: Date
  startTime?: Date      // Cuando entra a consulta
  
  status: 'waiting' | 'called' | 'in_consultation' | 'completed'
  room?: string
  position: number       // Lugar en la cola
  
  estimatedWait?: number // minutos
}
```

## Componentes de Agenda

### Calendario Semanal
```tsx
<WeekCalendar
  doctorId={selectedDoctor}
  onSlotClick={handleNewAppointment}
  onAppointmentClick={handleViewAppointment}
/>
```

### Selector de Horarios Disponibles
```tsx
<AvailableSlots
  doctorId={doctorId}
  date={selectedDate}
  duration={30}
  onSelect={handleSlotSelect}
/>
```

### Cola de Espera
```tsx
<WaitingRoomQueue>
  {waitingPatients.map((item, index) => (
    <WaitingRoomItem
      key={item.id}
      position={index + 1}
      patient={item.patient}
      appointment={item.appointment}
      waitTime={calculateWaitTime(item.checkInTime)}
      onCall={() => callPatient(item.id)}
    />
  ))}
</WaitingRoomQueue>
```

## Lógica de Disponibilidad

```typescript
export async function getAvailableSlots(
  doctorId: string,
  date: Date,
  duration: number
): Promise<TimeSlot[]> {
  // 1. Obtener horario del doctor para ese día
  const dayOfWeek = date.getDay()
  const schedule = await getDoctorSchedule(doctorId, dayOfWeek)
  
  if (!schedule || !schedule.isActive) return []
  
  // 2. Obtener citas existentes
  const existingAppointments = await getAppointments(doctorId, date)
  
  // 3. Obtener bloqueos
  const blocks = await getScheduleBlocks(doctorId, date)
  
  // 4. Generar slots disponibles
  const slots: TimeSlot[] = []
  let currentTime = parseTime(schedule.startTime)
  const endTime = parseTime(schedule.endTime)
  
  while (currentTime + duration <= endTime) {
    const slotStart = currentTime
    const slotEnd = currentTime + duration
    
    // Verificar si está en horario de comida
    if (schedule.breakStart && schedule.breakEnd) {
      const breakStart = parseTime(schedule.breakStart)
      const breakEnd = parseTime(schedule.breakEnd)
      if (slotStart < breakEnd && slotEnd > breakStart) {
        currentTime = breakEnd
        continue
      }
    }
    
    // Verificar si hay cita existente
    const hasConflict = existingAppointments.some(apt => 
      hasOverlap(slotStart, slotEnd, apt.datetime, apt.duration)
    )
    
    // Verificar si hay bloqueo
    const isBlocked = blocks.some(block =>
      hasOverlap(slotStart, slotEnd, block.startDatetime, block.endDatetime)
    )
    
    if (!hasConflict && !isBlocked) {
      slots.push({
        start: formatTime(slotStart),
        end: formatTime(slotEnd),
        available: true,
      })
    }
    
    currentTime += duration
  }
  
  return slots
}
```

## Recordatorios WhatsApp

```typescript
// Cron job que corre cada hora
export async function sendReminders() {
  const now = new Date()
  
  // Recordatorios 24h antes
  const tomorrow = addHours(now, 24)
  const appointments24h = await getAppointmentsBetween(
    addHours(now, 23),
    addHours(now, 25)
  )
  
  for (const apt of appointments24h) {
    if (!apt.reminder24hSent) {
      await sendWhatsAppReminder(apt, '24h')
      await markReminderSent(apt.id, '24h')
    }
  }
  
  // Recordatorios 1h antes
  const appointments1h = await getAppointmentsBetween(
    now,
    addHours(now, 2)
  )
  
  for (const apt of appointments1h) {
    if (!apt.reminder1hSent) {
      await sendWhatsAppReminder(apt, '1h')
      await markReminderSent(apt.id, '1h')
    }
  }
}
```

## Estados de Cita (Flujo)

```
scheduled → confirmed → checked_in → in_progress → completed
    ↓           ↓           ↓
cancelled    cancelled   no_show
```

## Skills que uso

@.claude/skills/calendar-ui.md
@.claude/skills/whatsapp-templates.md
@.claude/skills/realtime-updates.md
