# Reporte: Auditoría frontend + correcciones críticas

## 1. Resumen ejecutivo

Se recorrieron las páginas públicas, de autenticación y de dashboard, junto con
layouts y hooks, para detectar bugs de UX, llamadas inconsistentes a Supabase,
estados de loading/empty/error ausentes y tipos `any` evidentes. Se aplicaron
las correcciones obligatorias A-G y se dejó documentado el resto como pendiente.

Resultado:
- 7 archivos modificados (Navbar dashboard, ProjectsPage, ProtectedRoute,
  EditProjectPage, ProjectDetailPage, ForgotPasswordPage, auth.service,
  PublicNavbar, RecentActivity, UpcomingTasks, DashboardContentPanel).
- 0 llamadas `supabase.from()` directas en `components/`.
- 0 tipos `any[]` / `any` en los componentes tocados.
- `tsc --noEmit` no se pudo ejecutar: `node_modules` no está instalado.

## 2. Mapa de páginas

| Página | Estado | Notas |
| --- | --- | --- |
| `HomePage` | Funcional | Renderiza Hero/Stem/Stats/Featured. Loading vía componentes hijos. |
| `AboutPage` | Funcional | Estático, no requiere backend. |
| `ProjectsCatalogPage` | Funcional | Filtros + grid vía `publicService`. |
| `PublicProjectDetailPage` | Funcional | Loading/error/empty ya implementados. |
| `ProfessorProfilePage` | Funcional | La lectura de `projects` sigue usando `supabase.from` directo (migración previa la dejó así, fuera de alcance). |
| `LoginPage` | Funcional | Hook `useAuth` + validaciones. |
| `RegisterPage` | Funcional | Hook `useAuth` + límite institucional. |
| `ForgotPasswordPage` | **Parcial → corregido**: usaba `supabase.auth.resetPasswordForEmail` directo; ahora delega a `authService.resetPassword`. |
| `DashboardHome` | Funcional | Loading y error UI presentes; tipos `any[]` llegan desde `DashboardContentPanel` (tipado en este PR). |
| `ProjectsPage` | **Parcial → corregido**: la búsqueda local funcionaba pero no aceptaba `?q=` desde URL. Ahora sí. |
| `CreateProjectPage` | Funcional | Solo monta `ProjectForm`. |
| `EditProjectPage` | **Roto → corregido**: cualquier usuario podía ver/editar. Ahora valida ownership/admin, con estados `loading`/`not-found`/`forbidden`/`error`. |
| `ProjectDetailPage` | **Roto → corregido**: cualquier usuario podía ver borradores/archivados. Ahora valida visibilidad (publish/owner/admin), con estados diferenciados. |
| `ProfilePage` | Funcional | Solo monta `ProfileEditor`. |
| `AdminDashboardPage` | Funcional (parcial) | Migrado a `profileService.updateProfessorRole` en tarea previa. Tabs `publications` y `resources` están marcados como placeholders sin contenido (fuera de alcance). |
| `Navbar` (dashboard) | **Roto → corregido**: el input "Buscar..." no hacía nada. Ahora navega a `/dashboard/projects?q=...`. |
| `PublicNavbar` | **Buggy → corregido**: "Mis Proyectos" enviaba a `/dashboard/projects` aunque el visitante no estuviera autenticado. Ahora va a `/login` si no hay sesión. |

## 3. Bugs corregidos

| Archivo | Qué se corrigió |
| --- | --- |
| `src/components/layout/Navbar.tsx` | Input "Buscar..." reconectado a `/dashboard/projects?q=...` mediante `<form onSubmit>`; placeholder y aria-label ajustados; menú de usuario cierra al hacer click fuera (antes sólo con toggle, sin cierre al perder foco). |
| `src/pages/dashboard/projects/ProjectsPage.tsx` | Lee `?q=` desde `useSearchParams` como estado inicial; sincroniza `searchTerm` con la URL al cambiar; usa `setSearchParams(..., { replace: true })` para no llenar el history. |
| `src/components/ProtectedRoute.tsx` | Sustituye el mensaje crudo "No tienes permisos para crear proyectos. Rol actual: admin" por una vista neutra con CTA "Volver al inicio". Sin role ni texto de debug. |
| `src/pages/dashboard/projects/EditProjectPage.tsx` | Reescrito con máquina de estados (`loading`, `not-found`, `forbidden`, `error`, `ready`); valida que `user.id === project.professor_id` o `user.role === 'admin'`. Mensajes en español. |
| `src/pages/dashboard/projects/ProjectDetailPage.tsx` | Igual máquina de estados; añade regla: si el proyecto NO está `published`, solo el dueño o admin pueden verlo. |
| `src/pages/auth/ForgotPasswordPage.tsx` | Reemplaza la llamada directa a `supabase.auth.resetPasswordForEmail` por `authService.resetPassword`. Texto del toast改为 "Si la cuenta existe..." para no filtrar existencia de cuentas. |
| `src/services/auth.service.ts` | Añadido método `resetPassword(email, redirectTo)` que encapsula `supabase.auth.resetPasswordForEmail`. |
| `src/components/public/PublicNavbar.tsx` | "Mis Proyectos" enruta a `/login` si no hay `user`; antes iba a `/dashboard/projects` y disparaba el redirect del `ProtectedRoute`. |
| `src/components/dashboard/RecentActivity.tsx` | Tipado de props `recentProjects: Project[]`, `recentResources: Resource[]`, `recentPublications: Publication[]`. Eliminados 3 `any[]` y 3 `(project: any)`. |
| `src/components/dashboard/UpcomingTasks.tsx` | Eliminado `(activity: any)`. Uso de tipo `Activity & { priority?: ...; status?: ... }` para narrowing seguro. `dueDate` defensivo cuando `due_date` es null. |
| `src/components/dashboard/DashboardContentPanel.tsx` | Sustituidos 3 `any[]` por `Project[]`, `Resource[]`, `Publication[]`. |

## 4. Bugs detectados NO corregidos

| Prioridad | Archivo | Detalle |
| --- | --- | --- |
| Alta | `src/components/projects/ProjectForm.tsx:90` | Al crear proyecto nuevo, `uploadCoverImage` se llama con `project?.id || crypto.randomUUID()`. Si la subida ocurre antes de que exista el `project.id`, el archivo queda huérfano en `covers/<userId>/<random>` con un nombre no relacionado al proyecto. Correcto sería subir la portada **después** de crear el proyecto (que sí devuelve `id`), o primero crear sin portada y luego subir en un segundo paso. |
| Media | `src/components/layout/DashboardLayout.tsx` (líneas 31–39) | El layout pinta un header mobile (`<header className="lg:hidden ...">`) y debajo el `<Navbar />` (que NO tiene breakpoint). En móvil aparecen dos barras apiladas. Corregirlo requiere mover la barra móvil dentro del `Navbar` o eliminar el header del layout. Decidí dejarlo como pendiente para no tocar layouts en esta tarea. |
| Media | `src/pages/dashboard/DashboardHome.tsx` | `useDashboardStats` calcula `views` como `${projectsCount * 150}k` (placeholder). Mientras no exista una tabla de analytics, se debería eliminar la tarjeta "Visualizaciones" o etiquetarla como "estimado". |
| Media | `src/pages/dashboard/AdminDashboardPage.tsx` | Las pestañas `publications` y `resources` no tienen contenido (sólo el header con tabs). Quedan como placeholders visibles. Decidido no tocar (alcance explícito: no CRUD de publications/resources). |
| Baja | `src/components/projects/ProjectForm.tsx:90` también | El `slug` se pide manualmente. Si se autogenerase a partir del título se evitarían duplicados/inconsistencias; está fuera del alcance. |
| Baja | `src/pages/dashboard/ProfilePage.tsx` | Botón "Atrás" con `<Link to="/dashboard">` es OK; pero la página no tiene estado propio de error si `useAuthStore.profile` es null al cargar (renderiza con valores vacíos sin avisar). |
| Baja | `src/components/dashboard/QuickActions.tsx` | No audité en profundidad. Aparece en `DashboardHome` y puede tener CTAs a rutas no implementadas. Pendiente. |
| Baja | Varios `console.error` en catch de páginas (`PublicProjectsGrid`, `PublicProjectDetailPage`, `FeaturedProjects`, `DashboardHome`, `UpcomingTasks`, `ProjectsPage`) | La tarea no los prohíbe pero convendría centralizarlos en un logger. No modificado. |
| Baja | `src/pages/auth/ForgotPasswordPage.tsx` | La página referencia `/reset-password` que NO existe en `App.tsx` (no hay ruta `/reset-password`). El usuario que pinche el enlace de Supabase verá 404. Decidido no crear la ruta (fuera de alcance). |

## 5. Decisiones

- **Búsqueda del Navbar**: opté por **conectar** a `ProjectsPage` por query
  string (`/dashboard/projects?q=...`) en lugar de eliminarla, ya que la página
  ya disponía de `searchTerm` funcional. El input se convirtió en `<form>`
  para soportar Enter, con placeholder honesto ("Buscar proyectos...").
- **Protegido del estado**: reescribí `EditProjectPage` y `ProjectDetailPage`
  con una unión discriminada (`LoadState`) en lugar de tres `useState`. Esto
  evita race conditions entre `loading`, `not-found`, `forbidden` y `error`,
  que antes se mezclaban con un único `project` nullable.
- **Publicar/visibility**: en `ProjectDetailPage` el dashboard, un draft sólo
  lo ven dueño y admin. Los `published` los sigue viendo cualquiera (esto
  coincide con la convención de `publicService.getPublicProjectBySlug` que ya
  filtraba por `status='published'`).
- **ForgotPassword**: mantuve el formulario (es funcional). Cambié el copy
  del toast para no filtrar si una cuenta existe (privacidad/seguridad).
- **Tipos**: tipé `Project[]`, `Resource[]`, `Publication[]` en
  `RecentActivity` y `DashboardContentPanel`. No toqué hooks como
  `useDashboardStats` (sí los usan) para no salirme del scope.

## 6. Verificación

```
$ rg "supabase\.from\(['\"]" src/components
(no matches)

$ rg "supabase\.from\(['\"]" src/pages
src/pages/public/ProfessorProfilePage.tsx:26   # lectura de projects (ya en
                                              # estado conocido, fuera de
                                              # alcance)

$ rg ": any\[\]|: any\)" src
(no matches en componentes tocados en esta tarea)
```

- `npx tsc --noEmit` no se pudo ejecutar (no hay `node_modules`). El usuario
  debe correr `npm install && npm run build` para validar.
- No se añadieron tests, migraciones SQL ni cambios de storage.

## 7. Pendientes de producto

1. Decidir si los tabs `publications` y `resources` del admin deben ocultarse
   mientras no exista CRUD (mejor UX que placeholder visible).
2. Terminar la página `/reset-password` (Supabase envía al usuario allí pero
   la app devuelve 404). Plantilla: leer tokens del hash, llamar a
   `supabase.auth.updateUser({ password })` desde `auth.service`.
3. Refactor de `ProjectForm`: portada post-creación para evitar archivos
   huérfanos en Storage.
4. Limpiar el doble header en mobile del `DashboardLayout`.
5. Calcular `views` con datos reales o eliminar la tarjeta.
6. Eliminar `useDashboardStats`/`useDashboardData` de hooks con `supabase.from`
   directo y moverlos a servicios (consistencia con la regla aplicada en tareas
   previas a `profile.service` y `projects.service`).