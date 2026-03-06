# Historial del Proyecto

## Estado Actual (Marzo 2026)

- Landing page completa
- Cotizador de 5 pasos funcionando
- Portal de clientes con auth
- Dashboard con stats y proyectos
- Sistema de requests
- Notificaciones Telegram
- **Pendiente**: Deploy a Vercel (F9-T003)

## Proximos Pasos

1. Deploy a Vercel
2. Configurar webhook de Telegram
3. Crear primer cliente de prueba
4. Probar flujo completo

---

## Log de Actividad

### 2026-03-05
- Proyecto creado con Next.js 15, shadcn/ui, Supabase
- Landing page con Hero, Process, Portfolio, Testimonials
- Cotizador wizard de 5 pasos con API de leads
- Portal de clientes: login, dashboard, requests
- Middleware de auth protegiendo /portal/*
- Webhook de Telegram para bot publico

### 2026-03-06
- Pendiente deploy a Vercel (F9-T003)

---

## Relacion con FoxOrchestrator

- **Misma base de datos Supabase**: Proyecto `rjhnwqqooshosylsoqmu`
- **Mismo bot admin**: @FoxOrchestrator_bot recibe notificaciones de ambos
- **Flujo completo**:
  1. Lead llega via cotizador o Telegram
  2. Admin recibe notificacion
  3. Admin convierte lead a cliente en foxorchestrator
  4. Cliente accede al portal con sus credenciales
  5. Cliente crea requests
  6. FoxOrchestrator ejecuta los requests con Claude Code

---

## Notas de Ejecucion (FoxOrchestrator)

Este proyecto se ejecuta mediante FoxOrchestrator usando Claude Code CLI.

### Para ejecutar requests:
1. Crear request en portal o via Telegram
2. FoxOrchestrator genera plan automaticamente
3. Aprobar con `/aprobar <num>` en Telegram
4. El sistema ejecuta las tareas y notifica progreso
5. Al completar, hace push a GitHub automaticamente

### Cancelar requests (desde admin):
1. FoxOrchestrator → Requests → Click en request
2. Boton rojo "Cancelar"
3. Ingresar motivo
4. Se guarda en `activity_log` para trazabilidad

### Bugs conocidos del sistema:
- Claude CLI: usar `--dangerously-skip-permissions` (no `--yes`)
- Tareas con `npm run dev` se atoran (son servidores)
- Ver `foxorchestrator/CLAUDE.md` para detalles completos
