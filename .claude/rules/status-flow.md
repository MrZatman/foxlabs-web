---
paths:
  - "src/app/portal/**"
  - "src/app/admin/**"
---

# Flujo de Estados de Requests

## Estados Completos

```
inbox → planning → pending_approval → approved → queued
                                          ↓
                                     in_progress
                                          ↓
                                      deploying
                                          ↓
                                      completed
```

## Descripcion de Estados

| Status | Quien lo pone | Que significa |
|--------|---------------|---------------|
| `inbox` | Sistema | Request recien creado |
| `planning` | Orchestrator | PM generando plan |
| `pending_approval` | Orchestrator | Plan listo, esperando admin |
| `approved` | Admin (/aprobar) | Plan aprobado |
| `queued` | Sistema | En cola de ejecucion |
| `in_progress` | Queue Processor | Claude ejecutando tareas |
| `deploying` | Orchestrator | Push hecho, esperando Vercel |
| `completed` | DeployWatcher | Vercel termino deploy |
| `failed` | Sistema | Error en algun paso |
| `cancelled` | Admin | Cancelado manualmente |
| `on_hold` | Sistema | Esperando respuesta a pregunta |

## El Status "deploying"

**Por que existe**: Hay un gap de 1-2 minutos entre:
1. Claude termina tareas
2. Git push a GitHub
3. Vercel detecta push
4. Vercel hace build
5. Deploy ready

Sin este status, el cliente veria "En Progreso" y luego "Completado" sin entender que paso.

**Flujo real**:
```
in_progress → (Claude termina) → deploying → (Vercel ready) → completed
```

**En la UI**:
- Badge amarillo con animacion pulse
- Texto "Publicando..."
- Indica que el trabajo esta hecho, solo falta el deploy

## DeployWatcher

Servicio en foxorchestrator que hace polling a Vercel API cada 30 segundos.

```typescript
// Cuando detecta deployment READY
if (deployment.state === 'READY' && deployment.meta.githubCommitSha === commitSha) {
  // Actualiza request a completed
  await supabase.from('requests').update({ status: 'completed' })
}
```

## UI Components

### Badge de Status

```typescript
function getStatusConfig(status: string) {
  const configs = {
    deploying: {
      class: 'bg-cyan-500/20 text-cyan-400 animate-pulse',
      label: 'Publicando...'
    },
    // ...
  }
}
```

### Progress Bar

En detalle de request, mostrar progreso de tareas:
- Tareas completadas / Total
- Barra de progreso

### Timeline

Mostrar eventos con timestamps:
- Recibido
- En Progreso (started_at)
- Preview Listo (preview_url)
- Completado (completed_at)
