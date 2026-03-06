import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || 'salondefiestas'

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      clients(id, name, email),
      chrome_profiles(id, email, name, supabase_access_token),
      supabase_projects(id, name, supabase_ref)
    `)
    .ilike('name', `%${name}%`)
    .single()

  return NextResponse.json(project)
}
