# FoxOrchestrator - Monitor Page Implementation

## OBJETIVO
Crear página de monitoreo que muestre EN TIEMPO REAL qué está pasando en el backend para que NUNCA más se atore algo sin saber por qué.

## DECISIONES (YA TOMADAS)
- **Ubicación:** Electron (foxorchestrator) - necesita ver procesos locales
- **Retención:** 7 días con purge automático
- **Acciones:** Ver + Retry + Cancel (no skip)
- **Prioridad visual:** Errores → Timeline → Pokayokes

---

## INSTRUCCIONES DE EJECUCIÓN

```
MODO: Continuo sin pausas
VALIDACIÓN: Cada tarea debe funcionar antes de continuar
ERRORES: Documentar causa raíz y continuar
COMMITS: Git commit después de cada fase
TEST: Probar con evento real después de cada fase
```

---

## FASE 1: CREAR TABLAS EN SUPABASE

### F1-T001: Crear tabla execution_events
```sql
CREATE TABLE execution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exec_events_request ON execution_events(request_id);
CREATE INDEX idx_exec_events_created ON execution_events(created_at DESC);
CREATE INDEX idx_exec_events_status ON execution_events(status);
```

**VALIDAR:** 
```sql
SELECT * FROM execution_events LIMIT 1;
-- Debe retornar 0 rows sin error
```
- [ ] F1-T001

### F1-T002: Crear tabla pokayoke_log
```sql
CREATE TABLE pokayoke_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  rule_id VARCHAR(100) NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  detected TEXT NOT NULL,
  expected TEXT,
  action_taken VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pokayoke_request ON pokayoke_log(request_id);
CREATE INDEX idx_pokayoke_severity ON pokayoke_log(severity);
```

**VALIDAR:**
```sql
SELECT * FROM pokayoke_log LIMIT 1;
-- Debe retornar 0 rows sin error
```
- [ ] F1-T002

### F1-T003: Habilitar Realtime en las tablas
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE execution_events;
ALTER PUBLICATION supabase_realtime ADD TABLE pokayoke_log;
```

**VALIDAR:** Ir a Supabase Dashboard → Database → Replication y verificar que las tablas aparecen.
- [ ] F1-T003

### F1-T004: Crear función de purge automático (7 días)
```sql
CREATE OR REPLACE FUNCTION purge_old_events()
RETURNS void AS $$
BEGIN
  DELETE FROM execution_events WHERE created_at < NOW() - INTERVAL '7 days';
  DELETE FROM pokayoke_log WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Programar con pg_cron o llamar manualmente
```
- [ ] F1-T004

### F1-T005: Git commit fase 1
```bash
# No hay archivos que commitear, solo SQL en Supabase
# Documentar en .claude/rules/database.md las nuevas tablas
```
- [ ] F1-T005

---

## FASE 2: CREAR EVENT LOGGER SERVICE

### F2-T001: Crear electron/services/event-logger.ts
```typescript
// electron/services/event-logger.ts

import { supabase } from './supabase-sync'
import { mainWindow } from '../main'

export interface LogEvent {
  requestId: string
  taskId?: string
  eventType: string
  status: 'success' | 'failed' | 'warning' | 'info'
  message: string
  metadata?: Record<string, unknown>
}

class EventLogger {
  private static instance: EventLogger
  
  static getInstance(): EventLogger {
    if (!EventLogger.instance) {
      EventLogger.instance = new EventLogger()
    }
    return EventLogger.instance
  }

  async log(event: LogEvent): Promise<void> {
    const timestamp = new Date().toISOString()
    
    // 1. Log a consola (siempre visible)
    const prefix = this.getPrefix(event.status)
    console.log(`${prefix} [${event.eventType}] ${event.message}`)
    
    // 2. Guardar en Supabase
    try {
      await supabase.from('execution_events').insert({
        request_id: event.requestId,
        task_id: event.taskId || null,
        event_type: event.eventType,
        status: event.status,
        message: event.message,
        metadata: event.metadata || {},
        created_at: timestamp
      })
    } catch (err) {
      console.error('[EventLogger] Error saving to Supabase:', err)
    }
    
    // 3. Emitir a UI via IPC
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('execution-event', {
        ...event,
        created_at: timestamp
      })
    }
  }

  async logPokayoke(event: {
    requestId: string
    taskId?: string
    ruleId: string
    ruleName: string
    severity: 'info' | 'warning' | 'error'
    detected: string
    expected?: string
    actionTaken: 'detected' | 'corrected' | 'blocked' | 'ignored'
  }): Promise<void> {
    try {
      await supabase.from('pokayoke_log').insert({
        request_id: event.requestId,
        task_id: event.taskId || null,
        rule_id: event.ruleId,
        rule_name: event.ruleName,
        severity: event.severity,
        detected: event.detected,
        expected: event.expected || null,
        action_taken: event.actionTaken
      })
    } catch (err) {
      console.error('[EventLogger] Error saving pokayoke:', err)
    }
    
    // También loggear como evento normal
    await this.log({
      requestId: event.requestId,
      taskId: event.taskId,
      eventType: 'pokayoke_triggered',
      status: event.severity === 'error' ? 'failed' : 'warning',
      message: `${event.ruleName}: ${event.detected}`,
      metadata: { ruleId: event.ruleId, expected: event.expected, action: event.actionTaken }
    })
  }

  private getPrefix(status: string): string {
    switch (status) {
      case 'success': return '✅'
      case 'failed': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }
}

export const eventLogger = EventLogger.getInstance()
```

**VALIDAR:** `npm run electron:build` debe compilar sin errores
- [ ] F2-T001

### F2-T002: Test manual del EventLogger
```typescript
// Agregar al final de orchestrator.ts init() temporalmente:
import { eventLogger } from './event-logger'

// Test
await eventLogger.log({
  requestId: 'test-123',
  eventType: 'test_event',
  status: 'info',
  message: 'EventLogger funcionando'
})
```

**VALIDAR:**
1. Ver en consola de Electron que aparece el log
2. Ver en Supabase que se insertó en execution_events
3. BORRAR el test después de verificar
- [ ] F2-T002

### F2-T003: Git commit fase 2
```bash
git add electron/services/event-logger.ts
git commit -m "F2: EventLogger service"
```
- [ ] F2-T003

---

## FASE 3: INTEGRAR EVENT LOGGER EN SERVICIOS

### F3-T001: Integrar en orchestrator.ts
```typescript
import { eventLogger } from './event-logger'

// En handleNewRequest():
await eventLogger.log({
  requestId: request.id,
  eventType: 'execution_started',
  status: 'info',
  message: `Iniciando Request #${request.number}`
})

// En handleRequestComplete():
await eventLogger.log({
  requestId: request.id,
  eventType: 'execution_completed',
  status: 'success',
  message: `Request #${request.number} completado`
})

// En cualquier error:
await eventLogger.log({
  requestId: request.id,
  eventType: 'execution_error',
  status: 'failed',
  message: error.message,
  metadata: { stack: error.stack }
})
```

**VALIDAR:** Ejecutar un request y ver logs en Supabase
- [ ] F3-T001

### F3-T002: Integrar en queue-processor.ts
```typescript
import { eventLogger } from './event-logger'

// Al tomar request de la cola:
await eventLogger.log({
  requestId,
  eventType: 'queue_processing',
  status: 'info',
  message: 'Request tomado de la cola'
})

// Al pausar:
await eventLogger.log({
  requestId,
  eventType: 'execution_paused',
  status: 'warning',
  message: 'Ejecución pausada',
  metadata: { reason }
})
```
- [ ] F3-T002

### F3-T003: Integrar en claude-executor.ts
```typescript
import { eventLogger } from './event-logger'

// Al iniciar tarea:
await eventLogger.log({
  requestId,
  taskId: task.id,
  eventType: 'task_started',
  status: 'info',
  message: `Tarea ${taskNumber}/${totalTasks}: ${task.title}`
})

// Al completar tarea:
await eventLogger.log({
  requestId,
  taskId: task.id,
  eventType: 'task_completed',
  status: 'success',
  message: `Tarea completada en ${duration}s`,
  metadata: { duration, output: output.substring(0, 500) }
})

// Al fallar tarea:
await eventLogger.log({
  requestId,
  taskId: task.id,
  eventType: 'task_failed',
  status: 'failed',
  message: `Tarea falló: ${error.message}`,
  metadata: { error: error.message }
})

// Al iniciar Claude Code:
await eventLogger.log({
  requestId,
  taskId: task.id,
  eventType: 'claude_started',
  status: 'info',
  message: 'Claude Code iniciado'
})

// Timeout de Claude:
await eventLogger.log({
  requestId,
  taskId: task.id,
  eventType: 'claude_timeout',
  status: 'failed',
  message: `Claude no respondió en ${timeout}ms`
})
```
- [ ] F3-T003

### F3-T004: Integrar en github.ts
```typescript
import { eventLogger } from './event-logger'

// Al hacer commit:
await eventLogger.log({
  requestId,
  eventType: 'git_commit',
  status: 'success',
  message: `Commit ${commitHash.substring(0, 7)}`,
  metadata: { hash: commitHash, message: commitMessage }
})

// Al hacer push:
await eventLogger.log({
  requestId,
  eventType: 'git_push',
  status: 'success',
  message: `Push a ${branch} OK`
})

// Push fallido:
await eventLogger.log({
  requestId,
  eventType: 'git_push_failed',
  status: 'failed',
  message: `Push falló: ${error.message}`,
  metadata: { error: error.message, retry: retryCount }
})
```
- [ ] F3-T004

### F3-T005: Integrar en deploy-watcher.ts
```typescript
import { eventLogger } from './event-logger'

// Al detectar deploy iniciado:
await eventLogger.log({
  requestId,
  eventType: 'vercel_building',
  status: 'info',
  message: 'Vercel build iniciado'
})

// Al detectar deploy ready:
await eventLogger.log({
  requestId,
  eventType: 'vercel_ready',
  status: 'success',
  message: `Deploy completado: ${deployUrl}`,
  metadata: { url: deployUrl, duration: buildDuration }
})

// Deploy fallido:
await eventLogger.log({
  requestId,
  eventType: 'vercel_failed',
  status: 'failed',
  message: `Deploy falló: ${error}`,
  metadata: { error }
})
```
- [ ] F3-T005

### F3-T006: Test de integración
```
1. Crear un request de prueba
2. Aprobar con /aprobar
3. Ver que se loggean todos los eventos en execution_events
4. Verificar en Supabase:
   - execution_started
   - task_started (por cada tarea)
   - task_completed (por cada tarea)
   - git_commit
   - git_push
   - vercel_building
   - vercel_ready
   - execution_completed
```
- [ ] F3-T006

### F3-T007: Git commit fase 3
```bash
git add -A
git commit -m "F3: EventLogger integrado en todos los servicios"
```
- [ ] F3-T007

---

## FASE 4: CREAR UI BÁSICA DE MONITOR

### F4-T001: Crear página src/app/(admin)/monitor/page.tsx
```
Layout:
┌─────────────────────────────────────────────────────────┐
│ Monitor de Ejecución                        [Refresh]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [🔴 Errores: 0] [🟡 Warnings: 0] [🟢 OK: 0]           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Timeline de Eventos                                    │
│  ─────────────────────                                  │
│  15:10:00 ✅ execution_completed - Request #17 OK      │
│  15:09:45 ✅ vercel_ready - Deploy completado          │
│  15:09:30 ✅ git_push - Push a master OK               │
│  15:09:28 ✅ git_commit - Commit abc1234              │
│  15:09:00 ✅ task_completed - Tarea 2/2               │
│  15:08:30 ℹ️ task_started - Tarea 2/2                 │
│  ...                                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘

Funcionalidades:
- Query inicial: últimos 50 eventos
- Realtime subscription para nuevos eventos
- Auto-scroll al nuevo evento
- Click en evento para ver metadata
- Filtrar por status (success/failed/warning/info)
- Filtrar por request_id
```
- [ ] F4-T001

### F4-T002: Crear componente StatusCards
```typescript
// src/components/monitor/StatusCards.tsx

// Mostrar conteos de:
// - Errores (últimas 24h)
// - Warnings (últimas 24h)  
// - Requests activos
// - Requests completados hoy

// Query:
SELECT status, COUNT(*) 
FROM execution_events 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
```
- [ ] F4-T002

### F4-T003: Crear componente EventTimeline
```typescript
// src/components/monitor/EventTimeline.tsx

// Props:
// - events: LogEvent[]
// - onEventClick: (event) => void
// - filter: { status?: string, requestId?: string }

// Renderizar lista con:
// - Timestamp (formato HH:mm:ss)
// - Icono por status
// - event_type
// - message
// - Badge de request_id (clickeable para filtrar)
```
- [ ] F4-T003

### F4-T004: Agregar Realtime subscription
```typescript
// En page.tsx:

useEffect(() => {
  const channel = supabase
    .channel('execution_events')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'execution_events' },
      (payload) => {
        setEvents(prev => [payload.new, ...prev])
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```
- [ ] F4-T004

### F4-T005: Test de UI
```
1. Abrir /monitor en foxorchestrator
2. Ejecutar un request
3. Ver eventos apareciendo en tiempo real
4. Verificar que errores se muestran en rojo
5. Verificar que el contador se actualiza
```
- [ ] F4-T005

### F4-T006: Git commit fase 4
```bash
git add -A
git commit -m "F4: UI básica de Monitor con timeline y realtime"
```
- [ ] F4-T006

---

## FASE 5: AGREGAR PANEL DE ERRORES CON ACCIONES

### F5-T001: Crear componente ErrorPanel
```typescript
// src/components/monitor/ErrorPanel.tsx

// Mostrar solo eventos con status='failed'
// Para cada error:
// - Timestamp
// - Tipo de error (git_push_failed, task_failed, etc)
// - Mensaje
// - Request ID (link)
// - Botones: [Retry] [Ver detalles] [Ignorar]
```
- [ ] F5-T001

### F5-T002: Implementar acción Retry
```typescript
// Crear IPC handler en main.ts:

ipcMain.handle('retry-failed-event', async (_, eventId, eventType) => {
  // Dependiendo del tipo:
  // - git_push_failed → llamar github.pushToGitHub() de nuevo
  // - task_failed → re-ejecutar la tarea
  // - vercel_failed → esperar al próximo polling
})
```
- [ ] F5-T002

### F5-T003: Implementar acción Cancel
```typescript
// Crear IPC handler:

ipcMain.handle('cancel-request', async (_, requestId) => {
  // 1. Actualizar status a 'cancelled'
  // 2. Detener ejecución si está en progreso
  // 3. Loggear evento execution_cancelled
})
```
- [ ] F5-T003

### F5-T004: Git commit fase 5
```bash
git add -A
git commit -m "F5: ErrorPanel con acciones Retry y Cancel"
```
- [ ] F5-T004

---

## FASE 6: AGREGAR SYSTEM HEALTH

### F6-T001: Crear componente SystemHealth
```typescript
// src/components/monitor/SystemHealth.tsx

// Indicadores:
// - Supabase: verde si hay conexión
// - Telegram: verde si bot responde a /status
// - GitHub: verde si token válido
// - Vercel: verde si API responde
// - Queue: verde si processor está corriendo

// Cada indicador con:
// - 🟢 Healthy
// - 🟡 Degraded  
// - 🔴 Down
// - Último check: hace X segundos
```
- [ ] F6-T001

### F6-T002: Crear health check service
```typescript
// electron/services/health-monitor.ts

class HealthMonitor {
  async checkAll(): Promise<HealthStatus[]> {
    return [
      await this.checkSupabase(),
      await this.checkTelegram(),
      await this.checkGitHub(),
      await this.checkVercel(),
      await this.checkQueue()
    ]
  }

  private async checkSupabase(): Promise<HealthStatus> {
    try {
      await supabase.from('clients').select('id').limit(1)
      return { service: 'Supabase', status: 'healthy' }
    } catch {
      return { service: 'Supabase', status: 'down' }
    }
  }
  
  // ... otros checks
}
```
- [ ] F6-T002

### F6-T003: Auto-refresh cada 30s
```typescript
// En SystemHealth.tsx:

useEffect(() => {
  const interval = setInterval(async () => {
    const health = await window.api.checkHealth()
    setHealthStatus(health)
  }, 30000)
  
  return () => clearInterval(interval)
}, [])
```
- [ ] F6-T003

### F6-T004: Git commit fase 6
```bash
git add -A
git commit -m "F6: SystemHealth con auto-refresh"
```
- [ ] F6-T004

---

## FASE 7: VALIDACIÓN FINAL

### F7-T001: Test completo end-to-end
```
1. Abrir /monitor
2. Verificar SystemHealth muestra todo verde
3. Crear request de prueba desde portal
4. Ver evento "execution_started" aparecer
5. Aprobar con /aprobar
6. Ver eventos de tareas en tiempo real
7. Ver evento git_commit, git_push
8. Ver evento vercel_building, vercel_ready
9. Ver evento execution_completed
10. Verificar contadores actualizados
```
- [ ] F7-T001

### F7-T002: Test de error handling
```
1. Provocar un error (ej: quitar GITHUB_TOKEN)
2. Ejecutar request
3. Ver que git_push_failed aparece en ErrorPanel
4. Restaurar token
5. Click en Retry
6. Ver que push funciona
```
- [ ] F7-T002

### F7-T003: Documentar en CLAUDE.md
```
Agregar sección en CLAUDE.md:

## Monitor Page

La página /monitor muestra eventos en tiempo real:
- execution_events: todos los eventos de ejecución
- pokayoke_log: validaciones automáticas

Acciones disponibles:
- Retry: reintentar operación fallida
- Cancel: cancelar request en progreso
```
- [ ] F7-T003

### F7-T004: Git push final
```bash
git add -A
git commit -m "F7: Monitor Page completo y documentado"
```
- [ ] F7-T004

---

## LOG DE ACTIVIDAD

| Timestamp | Fase | Tarea | Status | Notas |
|-----------|------|-------|--------|-------|
| | | | | |

---

## PENDIENTES Y CAUSAS RAÍZ

| Tarea | Causa Raíz | Solución |
|-------|------------|----------|
| | | |

---

## EVENT TYPES REFERENCE

| Categoría | Eventos |
|-----------|---------|
| Execution | execution_started, execution_paused, execution_resumed, execution_cancelled, execution_completed |
| Tasks | task_started, task_completed, task_failed, task_skipped |
| Claude | claude_started, claude_completed, claude_timeout, claude_error, claude_retry |
| Git | git_commit, git_push, git_push_failed, git_push_retry |
| Vercel | vercel_building, vercel_ready, vercel_failed |
| Queue | queue_processing, queue_empty |
| Pokayoke | pokayoke_triggered, pokayoke_corrected, pokayoke_blocked |

---

## ESTIMACIÓN ACTUALIZADA

| Fase | Tiempo |
|------|--------|
| F1: Tablas SQL | 15 min |
| F2: EventLogger | 30 min |
| F3: Integración | 1.5 horas |
| F4: UI básica | 1.5 horas |
| F5: ErrorPanel | 1 hora |
| F6: SystemHealth | 45 min |
| F7: Testing | 30 min |
| **Total** | **~6 horas** |
