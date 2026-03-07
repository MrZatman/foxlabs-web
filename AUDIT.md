# Auditoria FoxLabs Web

**Fecha:** 2026-03-06
**Version:** 0.1.0
**Auditor:** Claude Opus 4.5

---

## Resumen Ejecutivo

| Categoria | Estado | Criticidad |
|-----------|--------|------------|
| Seguridad | CRITICO | Alta |
| Performance | MEDIO | Media |
| Codigo | ACEPTABLE | Baja |
| UI/UX | NECESITA MEJORAS | Media |
| Testing | INEXISTENTE | Alta |
| Base de Datos | ACEPTABLE | Media |

---

## 1. SEGURIDAD

### 1.1 Problemas Criticos

#### [CRITICO] Endpoints /api/debug/* sin autenticacion
```
/api/debug/data      - Expone: clientes, emails, proyectos
/api/debug/project   - Expone: datos de proyectos
/api/debug/requests  - Expone: requests del sistema
/api/debug/tables    - Expone: estructura de tablas
```
**Riesgo:** Cualquier persona puede acceder a datos sensibles.
**Solucion:** Eliminar o proteger con auth de admin.

#### [CRITICO] Endpoints /api/admin/* sin autenticacion
```
/api/admin/cleanup-clients
/api/admin/cleanup-duplicates
/api/admin/import-projects
/api/admin/migrate
/api/admin/migrate-monitor
/api/admin/migrate-supabase
/api/admin/scan-projects
/api/admin/set-admin-password
/api/admin/test-monitor
/api/admin/update-token
```
**Riesgo:** Cualquiera puede ejecutar migraciones, limpiezas, cambiar password.
**Solucion:** Agregar verificacion de ADMIN_EMAIL en cada endpoint.

#### [ALTO] Admin email hardcodeado
```typescript
// middleware.ts
const ADMIN_EMAIL = 'fer.frias0000@gmail.com'
```
**Riesgo:** Si se filtra el email, se sabe quien es el admin.
**Solucion:** Mover a variable de entorno ADMIN_EMAIL.

#### [MEDIO] Service Role Key en cliente
```typescript
// api/leads/route.ts
process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```
**Riesgo:** Si falla el service role, usa anon key como fallback.
**Solucion:** Fallar explicitamente si no hay service role key.

### 1.2 Recomendaciones de Seguridad

- [ ] Agregar rate limiting a endpoints publicos (/api/leads, /api/telegram/webhook)
- [ ] Implementar CORS restrictivo
- [ ] Agregar headers de seguridad (CSP, X-Frame-Options, etc.)
- [ ] Sanitizar inputs en formularios
- [ ] Validar con Zod todos los inputs de APIs

---

## 2. PERFORMANCE

### 2.1 Problemas Detectados

#### [MEDIO] Queries sin optimizar
- `requests` page carga hasta 200 items sin paginacion real del servidor
- `metrics` page hace multiples queries separadas (podria ser una sola)
- `recursos` page hace nested queries pesadas

#### [MEDIO] Sin caching
- No hay ISR (Incremental Static Regeneration)
- No hay cache de queries de Supabase
- Realtime en todas las paginas aunque no siempre necesario

#### [BAJO] Bundle size
- Lucide icons importados individualmente (bien)
- Sin analisis de bundle (deberia agregarse)

### 2.2 Recomendaciones de Performance

- [ ] Implementar paginacion server-side real (cursor-based)
- [ ] Agregar `revalidate` a paginas estaticas
- [ ] Usar `React.memo` en componentes de lista
- [ ] Agregar loading skeletons consistentes

---

## 3. CODIGO Y ARQUITECTURA

### 3.1 Problemas de Codigo

#### [MEDIO] Tipos inconsistentes
```typescript
// Ejemplo de cast forzado
(r.projects as unknown as { clients: { id: string; name: string } | null })?.clients
```
- Muchos `as unknown as` indican tipos mal definidos
- Faltan interfaces para relaciones de Supabase

#### [MEDIO] Componentes duplicados
- `StatCard` definido inline en metrics/page.tsx
- Deberia estar en /components/admin/stat-card.tsx

#### [BAJO] Console.logs en produccion
- Multiples `console.log` y `console.error` en APIs
- Deberian usar un logger estructurado

### 3.2 Estructura de Archivos

```
src/
├── app/                    # OK - App Router
├── components/
│   ├── admin/              # Solo 1 componente (toast-handler)
│   ├── monitor/            # 2 componentes
│   └── ui/                 # shadcn components - OK
└── lib/
    ├── supabase/           # OK - client, server, middleware
    └── utils.ts            # OK - cn helper
```

**Faltante:**
- `/components/admin/` necesita mas componentes reutilizables
- `/hooks/` para hooks custom
- `/types/` para tipos compartidos

---

## 4. UI/UX

### 4.1 Problemas de Diseno

#### [MEDIO] Inconsistencia de colores
- Algunos badges usan `bg-orange-500/20` otros `bg-orange-500`
- Mezcla de zinc-800, zinc-900, zinc-950 sin patron claro

#### [MEDIO] Paginas placeholder
```
/admin/metrics   - Graficas dicen "proximamente"
/admin/settings  - Funcionalidad incompleta
```

#### [BAJO] Falta feedback visual
- No hay confirmaciones de acciones (toast inconsistente)
- Loading states no uniformes

### 4.2 Recomendaciones UI (KISS, Minimalista)

**Paleta de colores sugerida:**
```css
--bg-primary: zinc-950      /* Fondo principal */
--bg-secondary: zinc-900    /* Cards, contenedores */
--bg-tertiary: zinc-800     /* Hover, inputs */
--border: zinc-800          /* Bordes */
--text-primary: white
--text-secondary: zinc-400
--accent: orange-500        /* Acciones principales */
--success: green-500
--warning: yellow-500
--error: red-500
```

- [ ] Unificar todos los fondos de cards a bg-zinc-900
- [ ] Unificar bordes a border-zinc-800
- [ ] Quitar gradientes y efectos innecesarios
- [ ] Reducir variantes de badges a 4: default, success, warning, error

---

## 5. TESTING

### 5.1 Estado Actual

**Tests existentes:** NINGUNO

```json
// package.json - No hay scripts de test
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

### 5.2 Recomendaciones de Testing

**Prioridad 1 - Unit Tests:**
- [ ] Validaciones de formularios (leads, requests)
- [ ] Funciones utilitarias (getRelativeTime, etc.)
- [ ] Transformaciones de datos

**Prioridad 2 - Integration Tests:**
- [ ] API endpoints (/api/leads, /api/portal/requests)
- [ ] Flujo de autenticacion

**Prioridad 3 - E2E Tests:**
- [ ] Flujo de cotizador
- [ ] Flujo de portal cliente
- [ ] Flujo de admin

---

## 6. BASE DE DATOS

### 6.1 Tablas Detectadas

| Tabla | Uso | Estado |
|-------|-----|--------|
| leads | Leads del cotizador | OK |
| clients | Clientes | OK |
| projects | Proyectos | OK |
| requests | Requests de trabajo | OK |
| tasks | Tareas de requests | OK |
| chrome_profiles | Perfiles Chrome | OK |
| supabase_projects | Proyectos Supabase | OK |
| execution_events | Eventos de monitor | OK |
| notifications | Notificaciones | Sin usar en UI? |
| activity_log | Log de actividad | Verificar uso |

### 6.2 Problemas de DB

#### [MEDIO] Sin indices documentados
- No hay evidencia de indices en queries frecuentes
- `requests.status`, `requests.project_id` deberian tener indices

#### [BAJO] RLS no verificado
- Asumo que RLS esta configurado en Supabase
- Deberia documentarse politicas

---

## 7. APIs Y ENDPOINTS

### 7.1 Endpoints Publicos (sin auth)

| Endpoint | Metodo | Proposito | Riesgo |
|----------|--------|-----------|--------|
| /api/leads | POST | Crear lead | BAJO - OK |
| /api/telegram/webhook | POST | Webhook Telegram | BAJO - OK |
| /api/debug/* | GET | Debug | CRITICO |
| /api/admin/* | GET/POST | Admin ops | CRITICO |

### 7.2 Endpoints Protegidos

| Endpoint | Metodo | Proposito |
|----------|--------|-----------|
| /api/portal/requests | POST | Crear request (auth) |
| /api/auth/logout | POST | Cerrar sesion |

### 7.3 Endpoints Faltantes

- [ ] /api/admin/monitor/retry - Llamado pero no existe
- [ ] /api/health - Health check para monitoreo

---

## 8. PAGINAS

### 8.1 Inventario de Paginas

**Publicas:**
- `/` - Landing page
- `/cotizar` - Wizard de cotizacion

**Portal Cliente:**
- `/portal/login` - Login
- `/portal/dashboard` - Dashboard cliente
- `/portal/requests/new` - Crear request
- `/portal/requests/[id]` - Ver request

**Admin:**
- `/admin/login` - Login admin
- `/admin` - Dashboard
- `/admin/leads` - Lista leads
- `/admin/leads/[id]` - Detalle lead
- `/admin/clients` - Lista clientes
- `/admin/clients/new` - Nuevo cliente
- `/admin/clients/[id]` - Detalle cliente
- `/admin/projects` - Lista proyectos
- `/admin/projects/new` - Nuevo proyecto
- `/admin/projects/import` - Importar proyectos
- `/admin/projects/[slug]` - Detalle proyecto
- `/admin/requests` - Kanban requests
- `/admin/requests/queue` - Cola de ejecucion
- `/admin/requests/[id]` - Detalle request
- `/admin/chrome` - Chrome profiles
- `/admin/chrome/new` - Nuevo profile
- `/admin/chrome/[id]` - Detalle profile
- `/admin/supabase` - Proyectos Supabase
- `/admin/supabase/new` - Nuevo proyecto
- `/admin/supabase/[id]` - Detalle proyecto
- `/admin/recursos` - Vista jerarquica
- `/admin/metrics` - Metricas
- `/admin/monitor` - Monitor realtime
- `/admin/activity` - Activity log
- `/admin/settings` - Configuracion

### 8.2 Paginas Incompletas

| Pagina | Problema |
|--------|----------|
| /admin/metrics | Graficas placeholder |
| /admin/settings | Funcionalidad limitada |
| /admin/activity | Verificar si funciona |

### 8.3 Paginas Faltantes Sugeridas

| Pagina | Proposito |
|--------|-----------|
| /admin/leads/new | Crear lead manual |
| /admin/requests/new | Crear request manual |
| /portal/profile | Perfil del cliente |
| /portal/projects | Lista de proyectos del cliente |
| /404 | Pagina de error personalizada |
| /500 | Pagina de error de servidor |

---

## 9. REDUNDANCIA Y LIMPIEZA

### 9.1 Codigo Redundante

- `StatCard` duplicado en metrics page (mover a componente)
- Status colors definidos en multiples lugares
- Priority colors definidos en multiples lugares

### 9.2 Archivos Potencialmente Sin Usar

```
/api/admin/migrate-monitor/     # Migracion one-time?
/api/admin/migrate-supabase/    # Migracion one-time?
/api/admin/test-monitor/        # Test endpoint
/api/admin/cleanup-*            # Cleanup scripts
```

**Recomendacion:** Mover scripts one-time a carpeta `/scripts/` y ejecutar via CLI.

---

## 10. CHECKLIST DE ACCION

### Prioridad CRITICA (Hacer YA)

- [ ] Eliminar o proteger /api/debug/*
- [ ] Agregar auth a todos los /api/admin/*
- [ ] Mover ADMIN_EMAIL a variable de entorno

### Prioridad ALTA (Esta semana)

- [ ] Crear tipos compartidos en /types/
- [ ] Agregar health check endpoint
- [ ] Implementar rate limiting basico
- [ ] Agregar paginas 404/500

### Prioridad MEDIA (Este mes)

- [ ] Unificar paleta de colores
- [ ] Agregar tests unitarios basicos
- [ ] Completar pagina de metrics con graficas reales
- [ ] Documentar RLS policies

### Prioridad BAJA (Backlog)

- [ ] Agregar analytics
- [ ] Implementar PWA
- [ ] Agregar i18n si se necesita
- [ ] E2E tests con Playwright

---

## 11. COMANDOS UTILES

```bash
# Verificar build
npm run build

# Analizar bundle (agregar a package.json)
# "analyze": "ANALYZE=true next build"

# Verificar tipos
npx tsc --noEmit

# Lint
npm run lint
```

---

## 12. PROXIMOS PASOS RECOMENDADOS

1. **Hoy:** Fix de seguridad critico (endpoints debug/admin)
2. **Manana:** Crear tipos compartidos y unificar colores
3. **Semana 1:** Agregar tests basicos y health check
4. **Semana 2:** Completar paginas incompletas
5. **Mes 1:** E2E tests y optimizaciones de performance

---

*Generado automaticamente por Claude Opus 4.5*
