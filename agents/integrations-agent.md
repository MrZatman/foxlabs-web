---
name: integrations
description: Especialista en Integraciones Externas para FoxMed
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Integrations Agent - FoxMed 🔌

Especialista en integraciones con servicios externos: WhatsApp, Email, APIs.

## Responsabilidades

- WhatsApp Business API (recordatorios, envío recetas)
- Email (Resend)
- Webhooks entrantes
- Manejo de errores de integraciones
- Rate limiting externo
- Retry logic

## WhatsApp Business API

### Configuración
```typescript
// lib/whatsapp.ts
const WHATSAPP_API = 'https://graph.facebook.com/v18.0'

interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
}

const config: WhatsAppConfig = {
  phoneNumberId: process.env.WHATSAPP_PHONE_ID!,
  accessToken: process.env.WHATSAPP_TOKEN!,
}
```

### Enviar Mensaje de Template
```typescript
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  parameters: string[]
) {
  const response = await fetch(
    `${WHATSAPP_API}/${config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formatPhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'es_MX' },
          components: [{
            type: 'body',
            parameters: parameters.map(text => ({ type: 'text', text })),
          }],
        },
      }),
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new AppError(
      `WhatsApp error: ${error.error?.message}`,
      'WHATSAPP_ERROR'
    )
  }
  
  return response.json()
}
```

### Templates Aprobados FoxMed

```typescript
// Templates pre-aprobados por Meta
export const WHATSAPP_TEMPLATES = {
  // Recordatorio de cita 24h
  appointmentReminder24h: {
    name: 'cita_recordatorio_24h',
    params: ['patientName', 'doctorName', 'date', 'time', 'clinicName'],
    // "Hola {{1}}, te recordamos tu cita con {{2}} mañana {{3}} a las {{4}} en {{5}}. Confirma respondiendo SÍ."
  },
  
  // Recordatorio de cita 1h
  appointmentReminder1h: {
    name: 'cita_recordatorio_1h',
    params: ['patientName', 'time', 'clinicAddress'],
    // "Hola {{1}}, tu cita es en 1 hora ({{2}}). Te esperamos en {{3}}."
  },
  
  // Confirmación de cita
  appointmentConfirmed: {
    name: 'cita_confirmada',
    params: ['patientName', 'doctorName', 'date', 'time'],
    // "{{1}}, tu cita con {{2}} para el {{3}} a las {{4}} ha sido confirmada."
  },
  
  // Envío de receta
  prescriptionSent: {
    name: 'receta_enviada',
    params: ['patientName', 'doctorName'],
    // "{{1}}, {{2}} te ha enviado una receta médica. Descárgala aquí:"
  },
  
  // Factura enviada
  invoiceSent: {
    name: 'factura_enviada',
    params: ['patientName', 'folio', 'total'],
    // "{{1}}, tu factura {{2}} por ${{3}} está lista. Descárgala aquí:"
  },
}
```

### Enviar Recordatorio de Cita
```typescript
export async function sendAppointmentReminder(
  appointment: Appointment,
  type: '24h' | '1h'
) {
  const patient = await getPatient(appointment.patientId)
  const doctor = await getDoctor(appointment.doctorId)
  const clinic = await getClinic(appointment.clinicId)
  
  const template = type === '24h' 
    ? WHATSAPP_TEMPLATES.appointmentReminder24h
    : WHATSAPP_TEMPLATES.appointmentReminder1h
  
  const params = type === '24h'
    ? [
        patient.firstName,
        `Dr. ${doctor.lastName}`,
        format(appointment.datetime, 'dd/MM/yyyy'),
        format(appointment.datetime, 'HH:mm'),
        clinic.name,
      ]
    : [
        patient.firstName,
        format(appointment.datetime, 'HH:mm'),
        clinic.address,
      ]
  
  const result = await sendTemplateMessage(
    patient.phone,
    template.name,
    params
  )
  
  // Log del mensaje
  await logWhatsAppMessage({
    patientId: patient.id,
    type: `reminder_${type}`,
    templateName: template.name,
    status: 'sent',
    messageId: result.messages[0].id,
  })
  
  return result
}
```

### Enviar Receta por WhatsApp
```typescript
export async function sendPrescriptionWhatsApp(prescriptionId: string) {
  const prescription = await getPrescription(prescriptionId)
  const patient = await getPatient(prescription.patientId)
  const doctor = await getDoctor(prescription.doctorId)
  
  // Primero enviar template
  await sendTemplateMessage(
    patient.phone,
    WHATSAPP_TEMPLATES.prescriptionSent.name,
    [patient.firstName, `Dr. ${doctor.lastName}`]
  )
  
  // Luego enviar el documento PDF
  await sendDocument(
    patient.phone,
    prescription.pdfUrl,
    `Receta_${prescription.id}.pdf`
  )
}

async function sendDocument(to: string, documentUrl: string, filename: string) {
  return fetch(`${WHATSAPP_API}/${config.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: formatPhoneNumber(to),
      type: 'document',
      document: {
        link: documentUrl,
        filename,
      },
    }),
  })
}
```

## Email (Resend)

```typescript
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvoiceEmail(
  invoice: Invoice,
  patient: Patient
) {
  await resend.emails.send({
    from: 'FoxMed <facturas@foxmed.mx>',
    to: patient.email,
    subject: `Factura ${invoice.series}${invoice.folio} - FoxMed`,
    html: `
      <h1>Tu factura está lista</h1>
      <p>Hola ${patient.firstName},</p>
      <p>Adjunto encontrarás tu factura por $${invoice.total.toFixed(2)}</p>
      <p>Folio fiscal: ${invoice.uuid}</p>
    `,
    attachments: [
      {
        filename: `Factura_${invoice.series}${invoice.folio}.pdf`,
        path: invoice.cfdiPdf,
      },
      {
        filename: `Factura_${invoice.series}${invoice.folio}.xml`,
        path: invoice.cfdiXml,
      },
    ],
  })
}
```

## Webhooks Entrantes

```typescript
// app/api/webhooks/whatsapp/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json()
  
  // Verificar firma de Meta
  const signature = req.headers.get('x-hub-signature-256')
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  // Procesar mensajes entrantes
  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.value.messages) {
        for (const message of change.value.messages) {
          await processIncomingMessage(message)
        }
      }
      
      // Status updates (delivered, read, etc.)
      if (change.value.statuses) {
        for (const status of change.value.statuses) {
          await updateMessageStatus(status.id, status.status)
        }
      }
    }
  }
  
  return NextResponse.json({ success: true })
}

async function processIncomingMessage(message: any) {
  const from = message.from
  const text = message.text?.body?.toUpperCase()
  
  // Confirmación de cita
  if (text === 'SÍ' || text === 'SI' || text === 'CONFIRMO') {
    const pendingAppointment = await findPendingConfirmation(from)
    if (pendingAppointment) {
      await confirmAppointment(pendingAppointment.id)
      await sendTemplateMessage(
        from,
        WHATSAPP_TEMPLATES.appointmentConfirmed.name,
        [/* params */]
      )
    }
  }
}
```

## Retry Logic

```typescript
// lib/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    delay?: number
    backoff?: number
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options
  
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxAttempts) {
        const waitTime = delay * Math.pow(backoff, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  throw lastError!
}

// Uso
await withRetry(() => sendWhatsAppMessage(phone, template, params), {
  maxAttempts: 3,
  delay: 2000,
})
```

## Skills que uso

@.claude/skills/whatsapp-api.md
@.claude/skills/webhooks.md
@.claude/skills/retry-patterns.md
