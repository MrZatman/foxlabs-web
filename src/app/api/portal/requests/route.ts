import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

interface RequestData {
  projectId: string
  type: string
  priority: string
  title: string
  description: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: RequestData = await request.json()

    // Validate
    if (!data.projectId || !data.type || !data.title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify project belongs to user
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .eq('id', data.projectId)
      .eq('client_id', client.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create request
    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert({
        project_id: data.projectId,
        type: data.type,
        priority: data.priority || 'medium',
        title: data.title,
        description: data.description,
        status: 'pending',
        source: 'portal'
      })
      .select('request_number')
      .single()

    if (error) {
      console.error('[Portal API] Error creating request:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Notify admin via Telegram
    await notifyAdmin({
      requestNumber: newRequest.request_number,
      projectName: project.name,
      type: data.type,
      priority: data.priority,
      title: data.title,
      description: data.description,
      clientEmail: user.email || ''
    })

    return NextResponse.json({
      success: true,
      requestNumber: newRequest.request_number
    })

  } catch (error) {
    console.error('[Portal API] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

async function notifyAdmin(data: {
  requestNumber: number
  projectName: string
  type: string
  priority: string
  title: string
  description: string
  clientEmail: string
}) {
  if (!ADMIN_BOT_TOKEN || !ADMIN_CHAT_ID) return

  const priorityEmoji: Record<string, string> = {
    low: '',
    medium: '',
    high: '⚠️',
    urgent: '🚨'
  }

  const message = `📋 <b>Nuevo Request #${data.requestNumber}</b>
${priorityEmoji[data.priority] || ''}

<b>Proyecto:</b> ${data.projectName}
<b>Tipo:</b> ${data.type}
<b>Prioridad:</b> ${data.priority}
<b>Cliente:</b> ${data.clientEmail}

<b>Titulo:</b> ${data.title}

<i>${data.description.slice(0, 300)}${data.description.length > 300 ? '...' : ''}</i>

Usa /aprobar ${data.requestNumber} para aprobar`

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
  } catch (error) {
    console.error('[Portal API] Telegram error:', error)
  }
}
