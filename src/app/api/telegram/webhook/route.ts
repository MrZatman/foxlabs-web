/**
 * Telegram Webhook - Bot Público (@FoxLabsDev_bot)
 *
 * Recibe mensajes de leads potenciales.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FOXLABS_BOT_TOKEN = process.env.TELEGRAM_FOXLABS_BOT_TOKEN
const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    text?: string
  }
}

export async function POST(request: Request) {
  try {
    const update: TelegramUpdate = await request.json()

    if (!update.message?.text) {
      return NextResponse.json({ ok: true })
    }

    const message = update.message!
    const { from, chat } = message
    const text = message.text!

    // Only process private chats
    if (chat.type !== 'private') {
      return NextResponse.json({ ok: true })
    }

    console.log(`[FoxLabsBot] Message from @${from.username || from.first_name}: ${text.slice(0, 50)}...`)

    // Check if lead exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('telegram_chat_id', from.id)
      .single()

    if (existingLead) {
      // Update existing lead
      await supabase
        .from('leads')
        .update({
          description: text,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLead.id)
    } else {
      // Create new lead
      await supabase.from('leads').insert({
        name: `${from.first_name}${from.last_name ? ' ' + from.last_name : ''}`,
        source: 'telegram',
        source_details: `@${from.username || 'sin_username'}`,
        telegram_chat_id: from.id,
        telegram_username: from.username,
        description: text,
        status: 'new'
      })
    }

    // Send auto-reply
    await sendAutoReply(chat.id, from.first_name)

    // Forward to admin
    await forwardToAdmin(from, text)

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[FoxLabsBot] Error:', error)
    return NextResponse.json({ ok: true })
  }
}

async function sendAutoReply(chatId: number, firstName: string) {
  if (!FOXLABS_BOT_TOKEN) return

  const message = `Hola ${firstName}! Gracias por contactar FoxLabs.

Tu mensaje fue recibido y te responderemos pronto.

Para mas informacion, visita nuestra web:
https://foxlabs.vercel.app/cotizar`

  await fetch(`https://api.telegram.org/bot${FOXLABS_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message
    })
  }).catch(console.error)
}

async function forwardToAdmin(
  from: { id: number; first_name: string; last_name?: string; username?: string },
  text: string
) {
  if (!ADMIN_BOT_TOKEN || !ADMIN_CHAT_ID) return

  const message = `📨 <b>Mensaje en @FoxLabsDev_bot</b>

De: @${from.username || 'sin_username'}
Nombre: ${from.first_name}${from.last_name ? ' ' + from.last_name : ''}

<i>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</i>`

  await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  }).catch(console.error)
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    bot: 'FoxLabsDev_bot',
    timestamp: new Date().toISOString()
  })
}
