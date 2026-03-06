# FoxOrchestrator - Arreglar Schema de Base de Datos

## Situación Actual

| Tabla | En el Schema | El Código Espera |
|-------|--------------|------------------|
| clients | Básica (name, email, phone) | + portal_enabled, is_vip |
| projects | Básica (name, client_id, production_url) | + slug, github_url, local_path, health_status, chrome_profile_id |
| chrome_profiles | NO EXISTE | Tabla completa |
| supabase_projects | NO EXISTE | Tabla completa |

---

## FASE 1: Crear Schema Completo

### F1-T001: Crear tabla chrome_profiles
```sql
CREATE TABLE chrome_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  profile_path TEXT,
  slots_total INTEGER DEFAULT 2,
  slots_used INTEGER DEFAULT 0,
  token_expires_at TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- [ ] F1-T001

### F1-T002: Crear tabla supabase_projects
```sql
CREATE TABLE supabase_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ref TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  region TEXT DEFAULT 'us-east-1',
  anon_key TEXT,
  service_role_key TEXT,
  db_password TEXT,
  chrome_profile_id UUID REFERENCES chrome_profiles(id),
  project_id UUID REFERENCES projects(id),
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'paused', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- [ ] F1-T002

### F1-T003: Actualizar tabla projects
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_default_branch TEXT DEFAULT 'main';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS local_path TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS framework TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS node_version TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS chrome_profile_id UUID REFERENCES chrome_profiles(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_project_id UUID REFERENCES supabase_projects(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'unknown';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_deploy_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS preview_url TEXT;
```
- [ ] F1-T003

### F1-T004: Actualizar tabla clients
```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_password_hash TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_portal_access TIMESTAMPTZ;
```
- [ ] F1-T004

---

## FASE 2: Formularios de Registro Manual

### F2-T001: UI Chrome Profiles
```
Arreglar /chrome-profiles para:
- Listar perfiles de la tabla chrome_profiles (no inventar datos)
- Formulario para crear nuevo perfil
- Formulario para editar perfil existente
```
- [ ] F2-T001

### F2-T002: UI Supabase Projects
```
Arreglar /supabase para:
- Listar proyectos de la tabla supabase_projects (no inventar datos)
- Formulario para crear nuevo
- Vincular a perfil Chrome
- Vincular a proyecto
```
- [ ] F2-T002

### F2-T003: UI Projects
```
Arreglar /projects para:
- Listar proyectos de la tabla projects (no nombres de carpetas)
- Formulario para crear/editar
- Vincular con cliente, chrome profile, supabase project
```
- [ ] F2-T003

### F2-T004: UI Clients
```
Arreglar /clients para:
- Listar clientes de la tabla clients (no nombres de carpetas)
- Formulario para crear/editar
- Asignar proyectos al cliente
```
- [ ] F2-T004

---

## FASE 3: Importación Automática

### F3-T001: Scanner de proyectos
```
Crear script que:
1. Escanee D:\FoxlabsProjects\*
2. Lea package.json → nombre, framework
3. Lea .git/config → github repo
4. Lea .env → SUPABASE_URL
5. Retorne lista para importar
```
- [ ] F3-T001

### F3-T002: UI de importación
```
Crear /projects/import:
1. Botón "Escanear"
2. Lista de proyectos encontrados
3. Checkboxes para seleccionar
4. Importar seleccionados a la DB
```
- [ ] F3-T002

---

## Log de Actividad

(Agregar aquí cada tarea completada)

---
