import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  const log: string[] = []

  try {
    // Get all supabase projects with their chrome profile
    const { data: supabaseProjects } = await supabase
      .from('supabase_projects')
      .select('id, name, supabase_ref, chrome_profile_id, status')
      .order('name')

    if (!supabaseProjects) {
      return NextResponse.json({ success: false, log: ['No supabase projects found'] })
    }

    // Get existing projects to avoid duplicates
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('supabase_project_id, name')

    const existingSupabaseIds = new Set(
      existingProjects?.map(p => p.supabase_project_id).filter(Boolean)
    )
    const existingNames = new Set(
      existingProjects?.map(p => p.name.toLowerCase())
    )

    log.push(`Found ${supabaseProjects.length} Supabase projects`)
    log.push(`Existing projects: ${existingProjects?.length || 0}`)

    let created = 0
    let skipped = 0

    for (const sp of supabaseProjects) {
      // Skip if already linked
      if (existingSupabaseIds.has(sp.id)) {
        log.push(`Skipped (already linked): ${sp.name}`)
        skipped++
        continue
      }

      // Skip if name already exists
      if (existingNames.has(sp.name.toLowerCase())) {
        log.push(`Skipped (name exists): ${sp.name}`)
        skipped++
        continue
      }

      // Create slug from name
      const slug = sp.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      // Create project
      const { error } = await supabase
        .from('projects')
        .insert({
          name: sp.name,
          slug: slug,
          supabase_project_id: sp.id,
          chrome_profile_id: sp.chrome_profile_id,
          status: sp.status === 'ACTIVE_HEALTHY' ? 'active' : 'paused',
          description: `Proyecto importado desde Supabase (${sp.supabase_ref})`
        })

      if (error) {
        log.push(`Error creating ${sp.name}: ${error.message}`)
      } else {
        log.push(`Created: ${sp.name}`)
        created++
      }
    }

    log.push(`=== DONE: ${created} created, ${skipped} skipped ===`)

    return NextResponse.json({ success: true, created, skipped, log })
  } catch (error) {
    log.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown'}`)
    return NextResponse.json({ success: false, log }, { status: 500 })
  }
}
