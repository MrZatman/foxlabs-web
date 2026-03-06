import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data: requests } = await supabase
    .from('requests')
    .select(`
      id,
      request_number,
      title,
      status,
      project_id,
      projects(id, name, slug)
    `)
    .order('request_number')

  return NextResponse.json({
    count: requests?.length || 0,
    requests: requests?.map(r => ({
      id: r.id,
      number: r.request_number,
      title: r.title,
      status: r.status,
      project_id: r.project_id,
      project_name: (r.projects as { name: string } | null)?.name || 'UNKNOWN'
    }))
  })
}
