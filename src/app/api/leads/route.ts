import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID
const CALLMEBOT_PHONE = process.env.CALLMEBOT_PHONE
const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY

interface LeadData {
  projectType: string
  features: string[]
  description: string
  referenceUrls: string
  budget: string
  timeline: string
  name: string
  email: string
  phone: string
  company: string
}

export async function POST(request: Request) {
  try {
    const data: LeadData = await request.json()

    // Validate required fields
    if (!data.name || !data.email || !data.projectType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert lead into database
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        source: 'web',
        source_details: '/cotizar',
        project_type: data.projectType,
        selected_templates: data.features,
        description: data.description,
        reference_urls: data.referenceUrls ? data.referenceUrls.split('\n').filter(Boolean) : [],
        budget_range: data.budget,
        timeline: data.timeline,
        status: 'new'
      })
      .select('lead_number')
      .single()

    if (error) {
      console.error('[Leads API] Error inserting lead:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Send notifications to admin (parallel)
    await Promise.all([
      notifyTelegram(data, lead?.lead_number || 0),
      notifyWhatsApp(data, lead?.lead_number || 0)
    ])

    return NextResponse.json({
      success: true,
      leadNumber: lead?.lead_number
    })

  } catch (error) {
    console.error('[Leads API] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

async function notifyTelegram(data: LeadData, leadNumber: number) {
  if (!ADMIN_BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.log('[Leads API] Telegram not configured, skipping notification')
    return
  }

  const budgetLabels: Record<string, string> = {
    small: '$1,000 - $3,000',
    medium: '$3,000 - $8,000',
    large: '$8,000 - $15,000',
    enterprise: '$15,000+',
    unsure: 'No seguro'
  }

  const projectLabels: Record<string, string> = {
    web: 'Aplicacion Web',
    ecommerce: 'E-commerce',
    landing: 'Landing Page',
    api: 'API/Backend',
    other: 'Otro'
  }

  const message = `🦊 <b>Nuevo Lead #${leadNumber}</b>

<b>Contacto:</b>
• Nombre: ${data.name}
• Email: ${data.email}
${data.phone ? `• Tel: ${data.phone}` : ''}
${data.company ? `• Empresa: ${data.company}` : ''}

<b>Proyecto:</b>
• Tipo: ${projectLabels[data.projectType] || data.projectType}
• Presupuesto: ${budgetLabels[data.budget] || data.budget}
• Timeline: ${data.timeline}
${data.features.length > 0 ? `• Features: ${data.features.join(', ')}` : ''}

<b>Descripcion:</b>
<i>${data.description.slice(0, 300)}${data.description.length > 300 ? '...' : ''}</i>

📩 Responder en 24h`

  try {
    await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    })
    console.log(`[Leads API] Telegram notification sent for lead #${leadNumber}`)
  } catch (error) {
    console.error('[Leads API] Telegram error:', error)
  }
}

async function notifyWhatsApp(data: LeadData, leadNumber: number) {
  if (!CALLMEBOT_PHONE || !CALLMEBOT_APIKEY) {
    console.log('[Leads API] WhatsApp not configured, skipping notification')
    return
  }

  const budgetLabels: Record<string, string> = {
    small: '$1k-$3k',
    medium: '$3k-$8k',
    large: '$8k-$15k',
    enterprise: '$15k+',
    unsure: 'No seguro'
  }

  const message = `🦊 *Nuevo Lead #${leadNumber}*

*${data.name}*
${data.email}
${data.phone ? `Tel: ${data.phone}` : ''}
${data.company ? `Empresa: ${data.company}` : ''}

Tipo: ${data.projectType}
Presupuesto: ${budgetLabels[data.budget] || data.budget}
Timeline: ${data.timeline}

${data.description.slice(0, 200)}${data.description.length > 200 ? '...' : ''}`

  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(message)}&apikey=${CALLMEBOT_APIKEY}`
    await fetch(url)
    console.log(`[Leads API] WhatsApp notification sent for lead #${leadNumber}`)
  } catch (error) {
    console.error('[Leads API] WhatsApp error:', error)
  }
}
