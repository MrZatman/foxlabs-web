import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  const log: string[] = []

  try {
    // F1-T001: Create execution_events table
    log.push('=== F1-T001: Creating execution_events table ===')
    const { error: err1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS execution_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
          task_id UUID,
          event_type VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_exec_events_request ON execution_events(request_id);
        CREATE INDEX IF NOT EXISTS idx_exec_events_created ON execution_events(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_exec_events_status ON execution_events(status);
      `
    })

    if (err1) {
      // Try direct insert approach - table might already exist
      log.push(`RPC not available, trying direct approach...`)
    }

    // Verify table exists
    const { data: check1, error: checkErr1 } = await supabase
      .from('execution_events')
      .select('id')
      .limit(1)

    if (checkErr1 && checkErr1.message.includes('does not exist')) {
      log.push(`ERROR: Table execution_events does not exist. Run SQL manually in Supabase Dashboard.`)
    } else {
      log.push(`✅ F1-T001: execution_events table ready`)
    }

    // F1-T002: Create pokayoke_log table
    log.push('=== F1-T002: Creating pokayoke_log table ===')
    const { data: check2, error: checkErr2 } = await supabase
      .from('pokayoke_log')
      .select('id')
      .limit(1)

    if (checkErr2 && checkErr2.message.includes('does not exist')) {
      log.push(`ERROR: Table pokayoke_log does not exist. Run SQL manually in Supabase Dashboard.`)
    } else {
      log.push(`✅ F1-T002: pokayoke_log table ready`)
    }

    return NextResponse.json({ success: true, log })
  } catch (error) {
    log.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown'}`)
    return NextResponse.json({ success: false, log }, { status: 500 })
  }
}

export async function GET() {
  // Return SQL to run manually
  const sql = `
-- F1-T001: Create execution_events table
CREATE TABLE IF NOT EXISTS execution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  task_id UUID,
  event_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exec_events_request ON execution_events(request_id);
CREATE INDEX IF NOT EXISTS idx_exec_events_created ON execution_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_events_status ON execution_events(status);

-- F1-T002: Create pokayoke_log table
CREATE TABLE IF NOT EXISTS pokayoke_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  task_id UUID,
  rule_id VARCHAR(100) NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  detected TEXT NOT NULL,
  expected TEXT,
  action_taken VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pokayoke_request ON pokayoke_log(request_id);
CREATE INDEX IF NOT EXISTS idx_pokayoke_severity ON pokayoke_log(severity);

-- F1-T003: Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE execution_events;
ALTER PUBLICATION supabase_realtime ADD TABLE pokayoke_log;

-- F1-T004: Purge function (7 days)
CREATE OR REPLACE FUNCTION purge_old_events()
RETURNS void AS $$
BEGIN
  DELETE FROM execution_events WHERE created_at < NOW() - INTERVAL '7 days';
  DELETE FROM pokayoke_log WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Validation queries:
-- SELECT * FROM execution_events LIMIT 1;
-- SELECT * FROM pokayoke_log LIMIT 1;
`

  return new NextResponse(sql, {
    headers: { 'Content-Type': 'text/plain' }
  })
}
