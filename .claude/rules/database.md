---
paths:
  - "**/*supabase*"
  - "**/api/**"
  - "src/lib/**"
---

# Database Schema (Supabase)

Proyecto compartido con foxorchestrator: `rjhnwqqooshosylsoqmu`

## leads
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_number SERIAL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  project_type TEXT,
  features TEXT[],
  description TEXT,
  budget TEXT,
  timeline TEXT,
  source TEXT DEFAULT 'web',
  source_details TEXT,
  telegram_chat_id BIGINT,
  telegram_username TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## clients
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  contact_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  name TEXT NOT NULL,
  production_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## requests
```sql
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number SERIAL,
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  source TEXT DEFAULT 'portal',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## execution_events (Monitor)
```sql
CREATE TABLE execution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  task_id UUID,
  event_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Realtime enabled
-- Indexes: request_id, created_at DESC, status
```

## pokayoke_log (Monitor)
```sql
CREATE TABLE pokayoke_log (
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
-- Realtime enabled
-- Auto-purge after 7 days via purge_old_events()
```
