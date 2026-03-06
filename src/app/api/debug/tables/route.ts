import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const results: Record<string, unknown> = {}

  const tablesToCheck = ['clients', 'projects', 'chrome_profiles', 'supabase_projects', 'leads', 'requests']

  for (const table of tablesToCheck) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(1)

    if (error) {
      results[table] = {
        exists: error.code !== '42P01',
        error: error.message,
        code: error.code
      }
    } else {
      results[table] = {
        exists: true,
        count: count,
        columns: data && data.length > 0 ? Object.keys(data[0]) : [],
        sample: data?.[0] || null
      }
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    tables: results
  }, { status: 200 })
}
