import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: requests, error } = await supabase
      .from('requests')
      .select(`
        id,
        request_number,
        title,
        status,
        created_at,
        projects(id, name, client_id, clients(id, name))
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({
      count: requests?.length || 0,
      requests: requests?.map(r => ({
        id: r.id,
        number: r.request_number,
        title: r.title,
        status: r.status,
        project: (r.projects as { name?: string })?.name,
        client: (r.projects as { clients?: { name?: string } })?.clients?.name
      }))
    })
  } catch (err) {
    return NextResponse.json({
      error: 'Exception',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
