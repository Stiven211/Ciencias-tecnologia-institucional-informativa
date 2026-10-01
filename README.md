# Área de Ciencias Naturales y Tecnología

Portal institucional del **Área de Ciencias Naturales y Tecnología** del Colegio José Celestino Mutis (San José del Guaviare, Colombia). Reúne proyectos académicos y científicos de docentes en Biología, Química, Física, Informática, Tecnología e Innovación, con sitio público y panel de gestión con roles.

**Demo:** https://ciencias-tecnologia-institucional-i.vercel.app

## Funcionalidades

**Sitio público (sin login)**
- Portada editorial con proyectos destacados, búsqueda local y filtros por disciplina
- Catálogo de proyectos (`/projects`) con filtros por área y página de detalle por slug
- Catálogo de publicaciones (`/publicaciones`) y perfiles públicos de docentes (`/profesor/:id`)
- Diseño responsive (desktop + móvil 375px) en español (`es-CO`)

**Panel docente (`/dashboard`, con login)**
- Resumen con estadísticas y contenido reciente (lecturas vía REST directo, resistentes a recarga F5)
- CRUD de proyectos (portada + galería en Supabase Storage), recursos, publicaciones y actividades
- Perfil docente con avatar, bio y especialización
- Roles y permisos: `admin` (gestión total + `manage_teachers`), `teacher` (su propio contenido), `visitor` (solo lectura)

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript + Vite 8 |
| Estilos | Tailwind CSS 4 |
| Estado / formularios | Zustand (sesión en `sessionStorage`) · React Hook Form + Zod |
| Rutas | React Router 7 |
| Backend | Supabase (PostgreSQL + Auth + Storage) vía `supabase-js` y REST directo (`src/utils/supabaseRest.ts`) |
| Tests E2E | Playwright + Chrome |
| Deploy | Vercel (`dist/`, preset Vite) |

## Inicio rápido

```bash
npm install
npm run dev      # http://localhost:9989
```

Variables de entorno (crear `.env`, nunca commitearlo):

```text
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Comandos:

```bash
npm run dev        # desarrollo (puerto 9989)
npm run build      # tsc + build producción -> dist/
npm run preview    # previsualizar build
npm run lint       # ESLint
```

Tests E2E (requieren dev corriendo + credenciales por entorno, nunca hardcodeadas):

```bash
$env:QA_ADMIN_EMAIL="usuario@institucional.edu"
$env:QA_ADMIN_PASSWORD="***"
npx playwright test --config=playwright.config.ts
```

## Estructura relevante

```text
src/
  pages/public/       # HomePage, ProjectsCatalogPage, PublicationsCatalogPage, ...
  pages/dashboard/    # DashboardHome, projects/resources/publications/activities/...
  components/         # layout, dashboard, public, ui reutilizable
  services/           # capa de datos (projects, resources, publications, activities, auth, dashboard, public)
  hooks/              # useDashboardStats, useDashboardData, useProjects, ...
  utils/supabaseRest.ts  # cliente REST directo (bypass LockManager en recargas F5)
  store/authStore.ts  # sesión persistida en sessionStorage
  config/permissions.ts  # roles y permisos
supabase/             # schema, RLS y storage
tests/                # specs Playwright
```

## Despliegue en Vercel

| Configuración | Valor |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

> Nota: por el `rewrite` de SPA (`/(.*) → /index.html`), rutas como `/.env` responden 200 con el `index.html`, **no** exponen variables. El `.env` local nunca se commitea ni se incluye en `dist/`.

## Estado y deuda conocida

- ✅ Login, guards de ruta, CRUD, F5 en dashboard (verificado con Chrome: 0 `Cargando...` atascados tras reload)
- ⚠️ SEO: faltan `description`, Open Graph/Twitter, `canonical` y `theme-color` (`index.html`)
- ⚠️ ESLint: quedan errores `react-hooks/set-state-in-effect` y `preserve-manual-memoization` en hooks de fetching — son patrones intencionales con `requestId` anti-race verificados en vivo; migrarlos es tarea aparte (ver `ROADMAP.md`)
- ⚠️ RLS de Storage: cualquier `teacher` puede actualizar/borrar objetos ajenos en `covers`/`gallery`; falta `requireOwnership` en update/delete de publications, resources y activities (solo projects lo tiene)

Ver próximas funciones en [`ROADMAP.md`](./ROADMAP.md).

## Autoría

**Stiven Urrego** — Área de Ciencias Naturales y Tecnología, Colegio José Celestino Mutis.
