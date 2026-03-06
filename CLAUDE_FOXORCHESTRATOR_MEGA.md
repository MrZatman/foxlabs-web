# FoxOrchestrator - Arreglar Schema y UI de Recursos

## INSTRUCCIONES DE EJECUCIÓN

```
MODO: Continuo sin pausas
VALIDACIÓN: Cada tarea debe compilar antes de marcar completada
ERRORES: Si falla, marcar PENDIENTE con causa raíz y continuar
COMMITS: Git commit después de cada fase completada
REPORTE: Al final, resumen de completadas vs pendientes
```

---

## ETAPA 1: VERIFICAR ESTADO ACTUAL DE TABLAS

### E1-T001: Verificar qué tablas existen en Supabase
```
Ejecutar query en Supabase para ver tablas existentes:

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

Documentar aquí qué encontraste:
- [ ] clients: ¿existe? ¿columnas?
- [ ] projects: ¿existe? ¿columnas?
- [ ] chrome_profiles: ¿existe?
- [ ] supabase_projects: ¿existe?
```
- [ ] E1-T001
- Resultado: _____

### E1-T002: Verificar columnas de cada tabla
```
Para cada tabla que existe, verificar columnas:

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nombre_tabla';

Documentar qué columnas faltan vs lo que el código espera.
```
- [ ] E1-T002
- Resultado: _____

---

## ETAPA 2: CREAR/ACTUALIZAR TABLAS

### E2-T001: Crear tabla chrome_profiles (si no existe)
```sql
CREATE TABLE IF NOT EXISTS chrome_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  profile_path TEXT,
  slots_total INTEGER DEFAULT 2,
  slots_used INTEGER DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

VALIDAR: SELECT * FROM chrome_profiles LIMIT 1;
```
- [ ] E2-T001

### E2-T002: Crear tabla supabase_projects (si no existe)
```sql
CREATE TABLE IF NOT EXISTS supabase_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ref TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  region TEXT DEFAULT 'us-east-1',
  anon_key TEXT,
  service_role_key TEXT,
  chrome_profile_id UUID REFERENCES chrome_profiles(id),
  project_id UUID,
  status TEXT DEFAULT 'healthy',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

VALIDAR: SELECT * FROM supabase_projects LIMIT 1;
```
- [ ] E2-T002

### E2-T003: Actualizar tabla clients (agregar columnas faltantes)
```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;

VALIDAR: SELECT column_name FROM information_schema.columns WHERE table_name = 'clients';
```
- [ ] E2-T003

### E2-T004: Actualizar tabla projects (agregar columnas faltantes)
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS local_path TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS framework TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS chrome_profile_id UUID REFERENCES chrome_profiles(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_project_id UUID REFERENCES supabase_projects(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'unknown';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS preview_url TEXT;

VALIDAR: SELECT column_name FROM information_schema.columns WHERE table_name = 'projects';
```
- [ ] E2-T004

### E2-T005: Git commit etapa 2
```
git add -A
git commit -m "E2: Schema actualizado - chrome_profiles, supabase_projects, clients, projects"
```
- [ ] E2-T005

---

## ETAPA 3: ARREGLAR UI DE CHROME PROFILES

### E3-T001: Revisar página actual /chrome-profiles o /chrome
```
1. Buscar el archivo de la página
2. Ver de dónde está leyendo datos actualmente
3. Documentar el problema
```
- [ ] E3-T001
- Problema encontrado: _____

### E3-T002: Arreglar para leer de tabla chrome_profiles
```
La página debe:
1. Hacer query a Supabase: SELECT * FROM chrome_profiles
2. Mostrar lista real de la DB
3. Si está vacía, mostrar "No hay perfiles registrados"
4. NO inventar datos, NO leer de carpetas

VALIDAR: npm run build (debe compilar sin errores)
```
- [ ] E3-T002

### E3-T003: Crear formulario para agregar Chrome Profile
```
Botón "Nuevo Perfil" que abra formulario/modal:
- Email (required)
- Nombre descriptivo (required)
- Notas (opcional)
- Slots totales (default 2)

Al guardar: INSERT INTO chrome_profiles

VALIDAR: Crear un perfil de prueba y verificar que aparezca en la lista
```
- [ ] E3-T003

### E3-T004: Git commit etapa 3
```
git add -A
git commit -m "E3: UI Chrome Profiles arreglada - lee de DB, formulario crear"
```
- [ ] E3-T004

---

## ETAPA 4: ARREGLAR UI DE SUPABASE PROJECTS

### E4-T001: Revisar página actual /supabase
```
1. Buscar el archivo de la página
2. Ver de dónde está leyendo datos actualmente
3. Documentar el problema
```
- [ ] E4-T001
- Problema encontrado: _____

### E4-T002: Arreglar para leer de tabla supabase_projects
```
La página debe:
1. Hacer query a Supabase: SELECT * FROM supabase_projects
2. JOIN con chrome_profiles para mostrar email del perfil
3. Si está vacía, mostrar "No hay proyectos Supabase registrados"

VALIDAR: npm run build
```
- [ ] E4-T002

### E4-T003: Crear formulario para agregar Supabase Project
```
Botón "Nuevo" que abra formulario:
- Nombre (required)
- Ref - el ID corto como rjhnwqqooshosylsoqmu (required)
- URL (auto-generar desde ref: https://{ref}.supabase.co)
- Región (default us-east-1)
- Chrome Profile (dropdown de chrome_profiles)
- Anon Key (input password)
- Service Role Key (input password)

Al guardar: INSERT INTO supabase_projects

VALIDAR: Crear proyecto de prueba
```
- [ ] E4-T003

### E4-T004: Git commit etapa 4
```
git add -A
git commit -m "E4: UI Supabase Projects arreglada - lee de DB, formulario crear"
```
- [ ] E4-T004

---

## ETAPA 5: ARREGLAR UI DE CLIENTS

### E5-T001: Revisar página actual /clients
```
1. Buscar el archivo de la página
2. Ver de dónde está leyendo datos actualmente
3. ¿Está mostrando nombres de carpetas en vez de clientes reales?
4. Documentar el problema
```
- [ ] E5-T001
- Problema encontrado: _____

### E5-T002: Arreglar para leer de tabla clients
```
La página debe:
1. Hacer query a Supabase: SELECT * FROM clients
2. Mostrar: nombre, email, teléfono, # proyectos, portal activo
3. Si está vacía, mostrar "No hay clientes registrados"
4. NO mostrar nombres de carpetas locales

VALIDAR: npm run build
```
- [ ] E5-T002

### E5-T003: Verificar formulario crear/editar cliente
```
Si ya existe el formulario, verificar que funcione.
Si no existe, crear:
- Nombre empresa (required)
- Nombre contacto
- Email (required)
- Teléfono
- WhatsApp
- Notas
- VIP (toggle)
- Portal habilitado (toggle)

VALIDAR: Crear cliente de prueba
```
- [ ] E5-T003

### E5-T004: Git commit etapa 5
```
git add -A
git commit -m "E5: UI Clients arreglada - lee de DB correctamente"
```
- [ ] E5-T004

---

## ETAPA 6: ARREGLAR UI DE PROJECTS

### E6-T001: Revisar página actual /projects
```
1. Buscar el archivo de la página
2. Ver de dónde está leyendo datos actualmente
3. ¿Está mostrando nombres de carpetas en vez de proyectos de DB?
4. Documentar el problema
```
- [ ] E6-T001
- Problema encontrado: _____

### E6-T002: Arreglar para leer de tabla projects
```
La página debe:
1. Hacer query a Supabase: SELECT * FROM projects con JOINs a clients, chrome_profiles
2. Mostrar: nombre, cliente, github, local_path, status
3. Si está vacía, mostrar "No hay proyectos registrados"
4. NO mostrar nombres de carpetas sin filtrar

VALIDAR: npm run build
```
- [ ] E6-T002

### E6-T003: Verificar formulario crear/editar proyecto
```
Verificar que el formulario tenga:
- Nombre (required)
- Slug (auto-generar)
- Cliente (dropdown de clients)
- Local path (D:/FoxlabsProjects/...)
- GitHub URL
- GitHub repo (MrZatman/nombre)
- Framework (nextjs, react, node, etc)
- Production URL
- Chrome Profile (dropdown)
- Supabase Project (dropdown)

VALIDAR: Editar proyecto existente y guardar
```
- [ ] E6-T003

### E6-T004: Git commit etapa 6
```
git add -A
git commit -m "E6: UI Projects arreglada - lee de DB correctamente"
```
- [ ] E6-T004

---

## ETAPA 7: CREAR SCANNER DE PROYECTOS LOCALES

### E7-T001: Crear servicio de escaneo
```
Crear electron/services/project-scanner.ts

Funcionalidad:
1. Recibir ruta base: D:/FoxlabsProjects
2. Listar carpetas (profundidad 2 para subcarpetas como MTI/mti-fleet)
3. Para cada carpeta con package.json:
   a. Leer package.json → name, framework (detectar si es next, react, etc)
   b. Leer .git/config → extraer remote URL (github)
   c. Leer .env → extraer NEXT_PUBLIC_SUPABASE_URL o SUPABASE_URL
4. Retornar array de proyectos encontrados

VALIDAR: Ejecutar scanner y verificar que detecte proyectos conocidos
```
- [ ] E7-T001

### E7-T002: Crear endpoint IPC para scanner
```
En electron/main.ts agregar:

ipcMain.handle('scan-local-projects', async (_, basePath: string) => {
  return projectScanner.scan(basePath)
})

VALIDAR: Llamar desde renderer y recibir lista
```
- [ ] E7-T002

### E7-T003: Crear UI de importación
```
Crear página /projects/import o /settings/import:

1. Input para ruta base (default: D:/FoxlabsProjects)
2. Botón "Escanear"
3. Tabla con proyectos encontrados:
   - Checkbox para seleccionar
   - Nombre
   - Path
   - GitHub (si detectó)
   - Supabase URL (si detectó)
   - ¿Ya existe en DB? (badge)
4. Para los seleccionados, permitir:
   - Asignar cliente (dropdown)
   - Asignar chrome profile (dropdown)
5. Botón "Importar seleccionados"
6. INSERT en projects los que no existen

VALIDAR: Escanear, seleccionar 1 proyecto, importar, verificar en /projects
```
- [ ] E7-T003

### E7-T004: Git commit etapa 7
```
git add -A
git commit -m "E7: Scanner de proyectos locales + UI importación"
```
- [ ] E7-T004

---

## ETAPA 8: VALIDACIÓN FINAL

### E8-T001: Verificar /chrome-profiles
```
1. Abrir página
2. Verificar que muestre datos de DB (o vacío si no hay)
3. Crear un perfil de prueba
4. Verificar que aparezca en lista
```
- [ ] E8-T001

### E8-T002: Verificar /supabase
```
1. Abrir página
2. Verificar que muestre datos de DB
3. Crear proyecto Supabase de prueba vinculado al perfil creado
4. Verificar que aparezca
```
- [ ] E8-T002

### E8-T003: Verificar /clients
```
1. Abrir página
2. Verificar que muestre clientes de DB (no carpetas)
3. Crear o editar un cliente
```
- [ ] E8-T003

### E8-T004: Verificar /projects
```
1. Abrir página
2. Verificar que muestre proyectos de DB (no carpetas)
3. Ir a /projects/import
4. Escanear
5. Importar un proyecto
6. Verificar que aparezca en /projects
```
- [ ] E8-T004

### E8-T005: Git push final
```
git push origin main
```
- [ ] E8-T005

---

## LOG DE ACTIVIDAD

| Timestamp | Tarea | Status | Notas |
|-----------|-------|--------|-------|
| | | | |

---

## PENDIENTES Y CAUSAS RAÍZ

| Tarea | Causa Raíz | Solución Propuesta |
|-------|------------|-------------------|
| | | |

---

## DATOS DE REFERENCIA

```
Supabase URL: https://rjhnwqqooshosylsoqmu.supabase.co
Projects Path: D:/FoxlabsProjects
```
