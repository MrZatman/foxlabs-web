import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  const log: string[] = []

  try {
    // Get MTI project's client_id to preserve
    const { data: mtiProject } = await supabase
      .from('projects')
      .select('client_id')
      .eq('name', 'MTI Fleet Manager')
      .single()

    const preserveClientId = mtiProject?.client_id
    log.push(`Preserving client_id: ${preserveClientId}`)

    // Delete all clients that are not the preserved one
    if (preserveClientId) {
      const { error, count } = await supabase
        .from('clients')
        .delete()
        .neq('id', preserveClientId)

      if (error) {
        log.push(`Error deleting clients: ${error.message}`)
      } else {
        log.push(`Deleted ${count} garbage clients`)
      }
    }

    // Verify remaining
    const { data: remaining } = await supabase
      .from('clients')
      .select('id, name, email')

    log.push(`Remaining clients: ${JSON.stringify(remaining)}`)

    return NextResponse.json({ success: true, log })
  } catch (error) {
    log.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown'}`)
    return NextResponse.json({ success: false, log }, { status: 500 })
  }
}
