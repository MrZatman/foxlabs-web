import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Folders to ignore
const IGNORE_FOLDERS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const basePath = searchParams.get('path') || 'D:/FoxlabsProjects'

    // Scan folders
    const entries = await readdir(basePath, { withFileTypes: true })
    const folders = entries
      .filter(e => e.isDirectory() && !IGNORE_FOLDERS.includes(e.name))
      .map(e => ({
        name: e.name,
        path: join(basePath, e.name).replace(/\\/g, '/')
      }))

    // Get existing projects
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id, name, folder_path')

    const existingPaths = new Set(
      existingProjects?.map(p => p.folder_path?.toLowerCase()).filter(Boolean)
    )

    // Get supabase projects for matching
    const { data: supabaseProjects } = await supabase
      .from('supabase_projects')
      .select('id, name, chrome_profile_id')

    // Categorize folders
    const results = {
      existing: [] as string[],
      canImport: [] as { name: string; path: string; matchedSupabase?: string }[],
      total: folders.length
    }

    for (const folder of folders) {
      if (existingPaths.has(folder.path.toLowerCase())) {
        results.existing.push(folder.name)
      } else {
        // Try to match with supabase project
        const match = supabaseProjects?.find(sp =>
          sp.name.toLowerCase() === folder.name.toLowerCase() ||
          sp.name.toLowerCase().replace(/[-_]/g, '') === folder.name.toLowerCase().replace(/[-_]/g, '')
        )
        results.canImport.push({
          name: folder.name,
          path: folder.path,
          matchedSupabase: match?.name
        })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const log: string[] = []

  try {
    const searchParams = request.nextUrl.searchParams
    const basePath = searchParams.get('path') || 'D:/FoxlabsProjects'

    // Scan folders
    const entries = await readdir(basePath, { withFileTypes: true })
    const folders = entries
      .filter(e => e.isDirectory() && !IGNORE_FOLDERS.includes(e.name))
      .map(e => ({
        name: e.name,
        path: join(basePath, e.name).replace(/\\/g, '/')
      }))

    // Get existing projects
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id, name, folder_path')

    const existingPaths = new Set(
      existingProjects?.map(p => p.folder_path?.toLowerCase()).filter(Boolean)
    )

    // Get supabase projects for matching
    const { data: supabaseProjects } = await supabase
      .from('supabase_projects')
      .select('id, name, chrome_profile_id')

    log.push(`Found ${folders.length} folders`)
    log.push(`Existing projects: ${existingProjects?.length || 0}`)

    let created = 0
    let skipped = 0

    for (const folder of folders) {
      // Skip if already exists
      if (existingPaths.has(folder.path.toLowerCase())) {
        skipped++
        continue
      }

      // Try to match with supabase project
      const match = supabaseProjects?.find(sp =>
        sp.name.toLowerCase() === folder.name.toLowerCase() ||
        sp.name.toLowerCase().replace(/[-_]/g, '') === folder.name.toLowerCase().replace(/[-_]/g, '')
      )

      // Create slug
      const slug = folder.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      // Check for package.json to detect framework
      let framework = null
      try {
        const pkgPath = join(folder.path, 'package.json')
        const pkgStat = await stat(pkgPath)
        if (pkgStat.isFile()) {
          const pkg = require(pkgPath)
          if (pkg.dependencies?.next || pkg.devDependencies?.next) framework = 'next'
          else if (pkg.dependencies?.react || pkg.devDependencies?.react) framework = 'react'
          else if (pkg.dependencies?.vue || pkg.devDependencies?.vue) framework = 'vue'
          else if (pkg.dependencies?.express || pkg.devDependencies?.express) framework = 'express'
          else if (pkg.dependencies?.electron || pkg.devDependencies?.electron) framework = 'electron'
        }
      } catch { }

      // Create project
      const { error } = await supabase
        .from('projects')
        .insert({
          name: folder.name,
          slug: slug,
          folder_path: folder.path,
          supabase_project_id: match?.id || null,
          chrome_profile_id: match?.chrome_profile_id || null,
          framework: framework,
          status: 'active'
        })

      if (error) {
        log.push(`Error: ${folder.name} - ${error.message}`)
      } else {
        const matchInfo = match ? ` (linked to Supabase: ${match.name})` : ''
        log.push(`Created: ${folder.name}${matchInfo}`)
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
