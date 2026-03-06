-- ═══════════════════════════════════════════════════════════════════════════
-- MONITOR PAGE - Database Setup
-- Run this in Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

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

-- F1-T003: Enable Realtime (may fail if already added, that's OK)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE execution_events;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE pokayoke_log;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- F1-T004: Purge function (7 days)
CREATE OR REPLACE FUNCTION purge_old_events()
RETURNS void AS $$
BEGIN
  DELETE FROM execution_events WHERE created_at < NOW() - INTERVAL '7 days';
  DELETE FROM pokayoke_log WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- VALIDATION QUERIES (run these to verify)
-- ═══════════════════════════════════════════════════════════════════════════

-- SELECT * FROM execution_events LIMIT 1;
-- SELECT * FROM pokayoke_log LIMIT 1;
-- SELECT proname FROM pg_proc WHERE proname = 'purge_old_events';
