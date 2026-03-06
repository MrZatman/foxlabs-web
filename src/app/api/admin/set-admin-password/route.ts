import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = 'fer.frias0000@gmail.com'
const ADMIN_PASSWORD = 'FoxAdmin2026!'

export async function POST() {
  try {
    // Try to get existing user
    const { data: users } = await supabase.auth.admin.listUsers()
    const existingUser = users?.users?.find(u => u.email === ADMIN_EMAIL)

    if (existingUser) {
      // Update password
      const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: ADMIN_PASSWORD
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Password actualizado',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    } else {
      // Create new admin user
      const { error } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario admin creado',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    }
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
