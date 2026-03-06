import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Supabase projects by chrome profile email
const supabaseProjectsData: Record<string, Array<{ name: string; ref: string; region: string; status: string }>> = {
  'pherny1@gmail.com': [
    { name: 'maldonado-fleet', ref: 'cqoltiphnfiaglfkyovj', region: 'us-east-1', status: 'ACTIVE_HEALTHY' },
    { name: 'MTI', ref: 'piajakkypghcwoijgbui', region: 'us-east-2', status: 'ACTIVE_HEALTHY' },
    { name: 'foxlogis', ref: 'zlcjznayvqiotmrmejfb', region: 'us-east-2', status: 'ACTIVE_HEALTHY' },
    { name: 'foxcrm', ref: 'iadztpkvzyrfrpwyqtfk', region: 'us-east-1', status: 'INACTIVE' },
    { name: 'foxandon-prod', ref: 'kdrmhmluyhrqmzgurscg', region: 'us-west-2', status: 'INACTIVE' },
    { name: 'mti-dispatch', ref: 'hynhxrkwydtsknybgwvw', region: 'us-east-2', status: 'INACTIVE' },
    { name: 'ang', ref: 'nerjeafhqlsypbqfwvyh', region: 'us-west-2', status: 'INACTIVE' },
    { name: 'cva-cotizador', ref: 'cvasbciowrnxqlxlsaok', region: 'us-west-2', status: 'INACTIVE' },
    { name: 'foxapartame', ref: 'ajnbxjagsaoygowzroyn', region: 'us-east-2', status: 'INACTIVE' },
    { name: 'foxcar', ref: 'tjtcokouzxupyqpzktgh', region: 'us-west-2', status: 'INACTIVE' },
    { name: 'foxsupply', ref: 'rakaadmqoioihdfjzgzb', region: 'us-east-2', status: 'INACTIVE' },
    { name: 'foxtravel', ref: 'frceaaioxqsmufpqtllf', region: 'us-west-2', status: 'INACTIVE' },
    { name: 'requisicloud', ref: 'xrkddzpuubmdkabtvtbc', region: 'us-west-2', status: 'INACTIVE' },
    { name: 'CarSOS', ref: 'qcrbtjyhdhiuirxhorrz', region: 'us-east-2', status: 'INACTIVE' },
    { name: 'mtidispatch', ref: 'fxcmwutguisbefsnbnnz', region: 'us-west-2', status: 'INACTIVE' },
  ],
  'ladynancy0000@gmail.com': [
    { name: 'scaledoc', ref: 'bmjfmhvhampnpyxptfhp', region: 'us-east-2', status: 'ACTIVE_HEALTHY' },
    { name: 'salondefiestas', ref: 'kzgeizjocivcvfktffjp', region: 'us-west-2', status: 'ACTIVE_HEALTHY' },
    { name: 'foxmed', ref: 'ggmawuczbxdbbvvtsreb', region: 'us-east-1', status: 'INACTIVE' },
  ],
  'pherny2024@gmail.com': [
    { name: 'segurosjuarez', ref: 'vlkodpxeeyeskcnhugzm', region: 'us-west-2', status: 'ACTIVE_HEALTHY' },
    { name: 'foxrifas', ref: 'oaopobqxawqsyexjfqqi', region: 'us-east-2', status: 'INACTIVE' },
    { name: 'foxvsm', ref: 'mpbnujzgceprduxioiay', region: 'us-west-2', status: 'INACTIVE' },
    { name: 'segurosdemo', ref: 'fqainbmyjuzkfsohoqsk', region: 'us-east-1', status: 'INACTIVE' },
  ],
  'scaledemos@gmail.com': [
    { name: 'SEN', ref: 'bigztqnwrmadddocwebr', region: 'us-east-1', status: 'ACTIVE_HEALTHY' },
    { name: 'yeswedo-system', ref: 'ifzyznsayyztwfldvuqz', region: 'us-east-1', status: 'ACTIVE_HEALTHY' },
    { name: 'nexusai', ref: 'ybvgvntzcxbzguxfbpcl', region: 'us-west-2', status: 'INACTIVE' },
  ],
}

const MTI_PROJECT_ID = '21b6f16c-d5ee-476c-a735-16fedeb4201f'

export async function POST() {
  const log: string[] = []

  try {
    // Get chrome profiles to map email -> id
    const { data: profiles } = await supabase
      .from('chrome_profiles')
      .select('id, email')

    const profileIdMap: Record<string, string> = {}
    profiles?.forEach(p => { profileIdMap[p.email] = p.id })

    log.push('Profile IDs: ' + JSON.stringify(profileIdMap))

    // Insert Supabase projects
    log.push('=== Inserting Supabase projects ===')
    let mtiSupabaseProjectId: string | null = null

    for (const [email, projects] of Object.entries(supabaseProjectsData)) {
      const chromeProfileId = profileIdMap[email]
      if (!chromeProfileId) {
        log.push(`No chrome profile ID for ${email}, skipping`)
        continue
      }

      for (const proj of projects) {
        const { data, error } = await supabase
          .from('supabase_projects')
          .insert({
            name: proj.name,
            supabase_ref: proj.ref,
            url: `https://${proj.ref}.supabase.co`,
            region: proj.region,
            status: proj.status,
            chrome_profile_id: chromeProfileId,
          })
          .select('id')
          .single()

        if (error) {
          log.push(`Error inserting ${proj.name}: ${error.message}`)
        } else {
          log.push(`Inserted: ${proj.name} (${proj.ref})`)
          if (proj.name === 'MTI') {
            mtiSupabaseProjectId = data.id
          }
        }
      }
    }

    // Update MTI project with supabase_project_id
    if (mtiSupabaseProjectId) {
      const { error } = await supabase
        .from('projects')
        .update({ supabase_project_id: mtiSupabaseProjectId })
        .eq('id', MTI_PROJECT_ID)

      if (error) {
        log.push(`Error linking MTI: ${error.message}`)
      } else {
        log.push(`Linked MTI project to supabase_project_id: ${mtiSupabaseProjectId}`)
      }
    }

    log.push('=== DONE ===')

    return NextResponse.json({ success: true, log })
  } catch (error) {
    log.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown'}`)
    return NextResponse.json({ success: false, log }, { status: 500 })
  }
}
