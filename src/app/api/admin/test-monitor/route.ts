import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Test insert into execution_events
    const { data, error } = await supabase
      .from('execution_events')
      .insert({
        request_id: null,
        task_id: null,
        event_type: 'test_event',
        status: 'info',
        message: 'Test: EventLogger working',
        metadata: { test: true, timestamp: new Date().toISOString() }
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Clean up test
    await supabase.from('execution_events').delete().eq('id', data.id)

    return NextResponse.json({
      success: true,
      message: 'execution_events table working',
      testEvent: data
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get recent events
    const { data: events, error } = await supabase
      .from('execution_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: events?.length || 0,
      events
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
}
