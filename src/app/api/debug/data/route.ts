import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  // Get all clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, email, contact_name')
    .order('name')
    .limit(30)

  // Get all projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, folder_path, client_id, clients(name)')
    .order('name')
    .limit(30)

  // Get chrome profiles
  const { data: chromeProfiles } = await supabase
    .from('chrome_profiles')
    .select('*')
    .limit(10)

  // Get supabase projects
  const { data: supabaseProjects } = await supabase
    .from('supabase_projects')
    .select('*')
    .limit(10)

  return NextResponse.json({
    clients: clients?.map(c => ({ name: c.name, email: c.email, contact: c.contact_name })),
    projects: projects?.map(p => ({
      name: p.name,
      slug: p.slug,
      folder: p.folder_path,
      client: (p.clients as { name: string } | null)?.name || 'SIN CLIENTE'
    })),
    chromeProfiles,
    supabaseProjects
  })
}
