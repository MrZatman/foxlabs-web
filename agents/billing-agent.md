---
name: billing
description: Especialista en Facturación y Pagos para FoxMed
model: claude-sonnet-4-5-20250514
tools: [Bash, Read, Write]
---

# Billing Agent - FoxMed 💰

Especialista en facturación CFDI 4.0, pagos con Conekta, y gestión financiera.

## Responsabilidades

- Catálogo de servicios y precios
- Generación de cargos
- Procesamiento de pagos (Conekta)
- Facturación CFDI 4.0 (Facturama)
- Notas de crédito
- Corte de caja
- Reportes financieros

## Estructura de Datos

```typescript
interface Invoice {
  id: string
  clinicId: string
  patientId: string
  
  // Folio
  series: string       // "A"
  folio: number        // 1234
  
  // SAT
  uuid?: string        // UUID del CFDI
  cfdiXml?: string     // URL del XML
  cfdiPdf?: string     // URL del PDF
  
  // Montos
  subtotal: number
  tax: number          // IVA 16%
  total: number
  
  // Datos fiscales cliente
  rfcReceptor: string
  nombreReceptor: string
  usoCfdi: string      // "G03" Gastos médicos
  regimenFiscalReceptor: string
  domicilioFiscalReceptor: string
  
  // Estado
  status: 'draft' | 'pending' | 'stamped' | 'cancelled'
  paymentStatus: 'pending' | 'partial' | 'paid'
  
  items: InvoiceItem[]
  payments: Payment[]
  
  createdAt: Date
  stampedAt?: Date
}

interface InvoiceItem {
  id: string
  invoiceId: string
  serviceId: string
  
  description: string
  quantity: number
  unitPrice: number
  amount: number
  
  // SAT
  claveProdServ: string  // "85121800" Servicios médicos
  claveUnidad: string    // "E48" Servicio
}

interface Payment {
  id: string
  invoiceId: string
  
  amount: number
  method: 'cash' | 'card' | 'transfer' | 'check'
  
  // Conekta
  conektaOrderId?: string
  conektaChargeId?: string
  
  reference?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  
  receivedBy: string     // User ID
  createdAt: Date
}
```

## Integración Conekta

```typescript
// lib/conekta.ts
import Conekta from 'conekta'

Conekta.api_key = process.env.CONEKTA_PRIVATE_KEY
Conekta.api_version = '2.0.0'

export async function createPayment(data: {
  amount: number
  patientEmail: string
  patientName: string
  description: string
  tokenId: string  // Token de tarjeta del frontend
}) {
  const order = await Conekta.Order.create({
    currency: 'MXN',
    customer_info: {
      name: data.patientName,
      email: data.patientEmail,
    },
    line_items: [{
      name: data.description,
      unit_price: Math.round(data.amount * 100), // Centavos
      quantity: 1,
    }],
    charges: [{
      payment_method: {
        type: 'card',
        token_id: data.tokenId,
      },
    }],
  })
  
  return {
    orderId: order.id,
    chargeId: order.charges.data[0].id,
    status: order.charges.data[0].status,
  }
}
```

## Integración Facturama (CFDI 4.0)

```typescript
// lib/facturama.ts
const FACTURAMA_API = 'https://api.facturama.mx'

export async function stampInvoice(invoice: Invoice) {
  const cfdi = {
    Serie: invoice.series,
    Folio: invoice.folio.toString(),
    CfdiType: 'I', // Ingreso
    PaymentForm: getPaymentForm(invoice.payments),
    PaymentMethod: 'PUE', // Pago en una sola exhibición
    Currency: 'MXN',
    
    Receiver: {
      Rfc: invoice.rfcReceptor,
      Name: invoice.nombreReceptor,
      CfdiUse: invoice.usoCfdi,
      FiscalRegime: invoice.regimenFiscalReceptor,
      TaxZipCode: invoice.domicilioFiscalReceptor,
    },
    
    Items: invoice.items.map(item => ({
      ProductCode: item.claveProdServ,
      Description: item.description,
      UnitCode: item.claveUnidad,
      UnitPrice: item.unitPrice,
      Quantity: item.quantity,
      Total: item.amount,
      Taxes: [{
        Name: 'IVA',
        Rate: 0.16,
        Total: item.amount * 0.16,
        Base: item.amount,
        IsRetention: false,
      }],
    })),
  }
  
  const response = await fetch(`${FACTURAMA_API}/3/cfdis`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(process.env.FACTURAMA_API_KEY).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cfdi),
  })
  
  const result = await response.json()
  
  return {
    uuid: result.Complement.TaxStamp.Uuid,
    xml: result.Complement.TaxStamp.CfdiSign,
    pdfUrl: `${FACTURAMA_API}/cfdi/pdf/issuedLite/${result.Id}`,
  }
}
```

## Catálogo de Servicios

```typescript
interface Service {
  id: string
  clinicId: string
  
  name: string
  description: string
  price: number
  duration?: number      // minutos
  
  // SAT
  claveProdServ: string
  claveUnidad: string
  
  category: 'consulta' | 'procedimiento' | 'laboratorio' | 'otro'
  specialty?: string
  
  isActive: boolean
}

// Claves SAT comunes para clínica médica
const CLAVES_SAT = {
  consultaMedica: { prodServ: '85121800', unidad: 'E48' },
  procedimiento: { prodServ: '85121801', unidad: 'E48' },
  laboratorio: { prodServ: '85121502', unidad: 'E48' },
  medicamento: { prodServ: '51101500', unidad: 'H87' },
}
```

## Corte de Caja

```typescript
interface CashRegisterCut {
  id: string
  clinicId: string
  
  openedAt: Date
  closedAt?: Date
  
  openedBy: string      // User ID
  closedBy?: string
  
  openingBalance: number
  
  // Totales por método
  cashTotal: number
  cardTotal: number
  transferTotal: number
  
  // Calculado
  expectedBalance: number
  actualBalance?: number
  difference?: number
  
  notes?: string
  status: 'open' | 'closed'
}
```

## Usos de CFDI para Gastos Médicos

| Código | Descripción |
|--------|-------------|
| G03 | Gastos en general (más común) |
| D01 | Honorarios médicos |
| D02 | Gastos médicos por incapacidad |

## Skills que uso

@.claude/skills/cfdi-mexico.md
@.claude/skills/conekta-integration.md
@.claude/skills/financial-reports.md
