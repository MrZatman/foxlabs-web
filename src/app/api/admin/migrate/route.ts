import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Chrome profiles data
const chromeProfiles = [
  { email: 'pherny1@gmail.com', name: 'pherny1', access_token: 'sbp_250b5f211d0b733a4f3ee07e7758c1c5e9b757e1' },
  { email: 'ladynancy0000@gmail.com', name: 'Mew', access_token: 'sbp_97ed3ad89d6318eff25c8b1bd70fc6c0a3883e7f' },
  { email: 'pherny2024@gmail.com', name: 'pherny2024', access_token: 'sbp_a96e82f0e643d2c678db25c9b1d8102cd588e728' },
  { email: 'scaledemos@gmail.com', name: 'scaledemos', access_token: 'sbp_6e3ce81a11b7c25090cc1fde08c690f00b5ab648' },
]

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
    // 1. Delete old data (except MTI project and requests)
    log.push('=== STEP 1: Cleaning old data ===')

    // Delete projects except MTI
    const { error: delProjects } = await supabase
      .from('projects')
      .delete()
      .neq('id', MTI_PROJECT_ID)
    if (delProjects) log.push(`Error deleting projects: ${delProjects.message}`)
    else log.push('Deleted projects (except MTI)')

    // Delete clients
    const { error: delClients } = await supabase
      .from('clients')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // delete all
    if (delClients) log.push(`Error deleting clients: ${delClients.message}`)
    else log.push('Deleted clients')

    // Delete supabase_projects
    const { error: delSupabase } = await supabase
      .from('supabase_projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (delSupabase) log.push(`Error deleting supabase_projects: ${delSupabase.message}`)
    else log.push('Deleted supabase_projects')

    // Delete chrome_profiles
    const { error: delChrome } = await supabase
      .from('chrome_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (delChrome) log.push(`Error deleting chrome_profiles: ${delChrome.message}`)
    else log.push('Deleted chrome_profiles')

    // 2. Insert Chrome profiles
    log.push('=== STEP 2: Inserting Chrome profiles ===')
    const profileIdMap: Record<string, string> = {}

    for (const profile of chromeProfiles) {
      const { data, error } = await supabase
        .from('chrome_profiles')
        .insert({
          email: profile.email,
          name: profile.name,
          supabase_access_token: profile.access_token,
          is_active: true,
          slots_total: 2,
          slots_used: 0,
        })
        .select('id')
        .single()

      if (error) {
        log.push(`Error inserting ${profile.email}: ${error.message}`)
      } else {
        profileIdMap[profile.email] = data.id
        log.push(`Inserted chrome profile: ${profile.email} (${data.id})`)
      }
    }

    // 3. Insert Supabase projects
    log.push('=== STEP 3: Inserting Supabase projects ===')
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
          log.push(`Error inserting supabase project ${proj.name}: ${error.message}`)
        } else {
          log.push(`Inserted supabase project: ${proj.name} (${proj.ref})`)
          // Save MTI supabase project ID
          if (proj.name === 'MTI') {
            mtiSupabaseProjectId = data.id
          }
        }
      }

      // Update slots_used
      const projectCount = projects.length
      await supabase
        .from('chrome_profiles')
        .update({ slots_used: projectCount })
        .eq('id', chromeProfileId)
    }

    // 4. Create MTI client
    log.push('=== STEP 4: Creating MTI client ===')
    const { data: mtiClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: 'MTI',
        email: 'hugoespino@mti.com',
        contact_name: 'Hugo Espino',
        portal_enabled: true,
      })
      .select('id')
      .single()

    if (clientError) {
      log.push(`Error creating MTI client: ${clientError.message}`)
    } else {
      log.push(`Created MTI client: ${mtiClient.id}`)

      // 5. Update MTI project to link to client and supabase project
      log.push('=== STEP 5: Linking MTI project ===')
      const pherny1ProfileId = profileIdMap['pherny1@gmail.com']

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          client_id: mtiClient.id,
          supabase_project_id: mtiSupabaseProjectId,
          chrome_profile_id: pherny1ProfileId,
          folder_path: 'D:/FoxlabsProjects/MTI/mti-fleet',
          github_repo: 'MrZatman/mti-fleet',
          status: 'active',
          health_status: 'healthy',
        })
        .eq('id', MTI_PROJECT_ID)

      if (updateError) {
        log.push(`Error updating MTI project: ${updateError.message}`)
      } else {
        log.push('Linked MTI project to client, supabase, and chrome profile')
      }
    }

    log.push('=== MIGRATION COMPLETE ===')

    return NextResponse.json({
      success: true,
      log,
    })
  } catch (error) {
    log.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown'}`)
    return NextResponse.json({
      success: false,
      log,
    }, { status: 500 })
  }
}
