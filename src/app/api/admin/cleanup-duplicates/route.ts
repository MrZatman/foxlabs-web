import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  // Find all projects and check for issues
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, folder_path')
    .order('name')

  const issues = {
    noFolder: projects?.filter(p => !p.folder_path),
    duplicateFolders: [] as string[],
    subfolderProjects: projects?.filter(p => {
      if (!p.folder_path) return false
      const parts = p.folder_path.replace('D:/FoxlabsProjects/', '').split('/')
      return parts.length > 1
    })
  }

  // Check for duplicate folder paths
  const folderCounts: Record<string, number> = {}
  projects?.forEach(p => {
    if (p.folder_path) {
      folderCounts[p.folder_path] = (folderCounts[p.folder_path] || 0) + 1
    }
  })
  issues.duplicateFolders = Object.entries(folderCounts)
    .filter(([_, count]) => count > 1)
    .map(([path]) => path)

  return NextResponse.json({
    total: projects?.length,
    issues
  })
}

export async function POST() {
  const log: string[] = []

  try {
    // Get all projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, slug, folder_path, requests(count)')
      .order('name')

    // Find the MTI project that has requests (the original one to keep)
    const mtiWithRequests = projects?.find(p =>
      p.name === 'MTI Fleet Manager' ||
      (p.folder_path?.includes('mti-fleet') && p.requests)
    )

    // Delete the duplicate MTI that was created during import (no requests)
    const mtiDuplicate = projects?.find(p =>
      p.name === 'MTI' &&
      p.folder_path === 'D:/FoxlabsProjects/MTI'
    )

    if (mtiDuplicate) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', mtiDuplicate.id)

      if (error) {
        log.push(`Error deleting MTI duplicate: ${error.message}`)
      } else {
        log.push(`Deleted duplicate: MTI (${mtiDuplicate.id})`)
      }
    }

    // Also update MTI Fleet Manager to have the correct folder if needed
    if (mtiWithRequests && mtiWithRequests.folder_path !== 'D:/FoxlabsProjects/MTI/mti-fleet') {
      log.push(`MTI Fleet Manager folder: ${mtiWithRequests.folder_path}`)
    }

    // Count remaining
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })

    log.push(`Remaining projects: ${count}`)

    return NextResponse.json({ success: true, log })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
}
