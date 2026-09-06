# Auditoría Backend Supabase - Área de Ciencias

Fecha: 2026-09-01
Alcance: Capa de servicios, store de auth, hooks de datos, capa SQL (schema + RLS + storage) y tipos TypeScript.

---

## 1. Resumen ejecutivo

El backend Supabase del proyecto tiene una **base sólida y bien intencionada**: el esquema SQL está normalizado, las políticas RLS están activas en todas las tablas y los buckets de storage están correctamente configurados como públicos. La capa de servicios (`src/services/**`) expone una API razonable y la separación de responsabilidades es clara.

Sin embargo, la implementación arrastra **problemas típicos de fase de prototipado**: 30+ `console.log` de depuración en servicios y auth, dos archivos de tipos en paralelo (`types/index.ts` y `types/database.ts`) con definiciones contradictorias, **un bug crítico** donde las imágenes de galería se subían al bucket equivocado (`covers` en vez de `gallery`), y **ausencia total de validación de ownership** en `updateProject` y `deleteProject` (que dependía exclusivamente de la RLS, lo cual filtra información de error y abre vectores de enumeración). El `authStore.ts` tenía un `if (!authListener)` a nivel de módulo (fuera de la función `create`), bloques `catch` vacíos y código duplicado entre `initialize` y el listener de `onAuthStateChange`.

Nivel de madurez general: **MVP funcional con deuda técnica moderada**. Tras los cambios de esta sesión, los servicios críticos (auth + projects) quedan limpios, tipados estrictamente, con validación de ownership y sin ruido de depuración. Quedan recomendaciones de hardening para siguientes prompts (ver §7).

---

## 2. Archivos analizados

### Servicios y cliente Supabase
- `src/lib/supabaseClient.ts`
- `src/services/auth.service.ts` ✏️
- `src/services/projects.service.ts` ✏️
- `src/services/public.service.ts`
- `src/services/publications.service.ts`
- `src/services/resources.service.ts`
- `src/services/activities.service.ts`

### Tipos
- `src/types/index.ts` ✏️
- `src/types/database.ts` 🗑️ (eliminado, era código muerto que duplicaba y contradecía `index.ts`)

### Store y hooks
- `src/store/authStore.ts` ✏️
- `src/hooks/useAuth.ts`
- `src/hooks/usePermissions.ts`
- `src/hooks/useInstitutionalUsers.ts`
- `src/hooks/useProjects.ts` ✏️
- `src/hooks/useDashboardData.ts`
- `src/hooks/useDashboardStats.ts`
- `src/hooks/useProfessorStats.ts`

### Configuración
- `src/config/permissions.ts`

### SQL (esquema, RLS, storage)
- `supabase/schema.sql`
- `supabase/rls.sql`
- `supabase/storage.sql`
- `supabase/migration_verify_columns.sql`

### Componentes que tocan la capa de datos (revisados para detectar bypasses)
- `src/components/profile/ProfileEditor.tsx` ✏️
- `src/components/ui/AvatarUpload.tsx`
- `src/components/projects/ProjectForm.tsx` ✏️
- `src/pages/dashboard/projects/ProjectsPage.tsx` ✏️
- `src/pages/dashboard/projects/EditProjectPage.tsx`
- `src/pages/dashboard/projects/ProjectDetailPage.tsx`

> ✏️ = modificado en esta sesión · 🗑️ = eliminado

---

## 3. Tablas y tipos detectados

### Tablas reales (de `supabase/schema.sql`)

| Tabla | Columnas clave | Notas |
|---|---|---|
| `profiles` | `id` (FK→auth.users), `email`, `full_name`, `role` (admin/teacher/visitor), `avatar_url`, `bio`, `specialization`, `created_at`, `updated_at` | 1 fila por usuario. `id` viene de `auth.users.id`. |
| `projects` | `id`, `professor_id` (FK→profiles), `title`, `slug` (UNIQUE), `description`, `content`, `status` (draft/published/archived), `cover_image`, `technologies` (text[]), `categories` (text[] con CHECK a 10 valores STEM), `gallery_images` (text[]) | Slug único. Categorías restringidas por CHECK constraint. |
| `resources` | `id`, `professor_id`, `title`, `type` (document/video/link/image), `file_url`, `description` | |
| `publications` | `id`, `professor_id`, `title`, `excerpt`, `content`, `cover_image`, `published`, `published_at` | |
| `activities` | `id`, `professor_id`, `title`, `description`, `due_date` (DATE) | |

Índices: `idx_projects_professor_id`, `idx_projects_slug`, `idx_projects_categories` (GIN), `idx_projects_gallery_images` (GIN), más los equivalentes en `professor_id` para resources/publications/activities.

Triggers: `update_updated_at_column()` aplicado a las 5 tablas.

### Inconsistencias de tipos detectadas y corregidas

Antes había **dos conjuntos de tipos contradictorios** viviendo en paralelo:

| Campo | `types/index.ts` (antes) | `types/database.ts` (antes) | DB real |
|---|---|---|---|
| `avatar_url` | `string \| undefined` | `string \| null` | `TEXT` (null) |
| `bio` | `string \| undefined` | `string \| null` | `TEXT` (null) |
| `specialization` | `string \| undefined` | `string \| null` | `TEXT` (null) |
| `Project.description` | `string \| undefined` | `string \| null` | `TEXT` (null) |
| `Project.cover_image` | `string \| undefined` | `string \| null` | `TEXT` (null) |
| `Project.technologies` | `string[]` | `string[] \| null` | `TEXT[]` (null) |
| `Project.categories` | `string[]` | `string[] \| null` | `TEXT[]` (null) |
| `Project.gallery_images` | `string[]` | `string[] \| null` | `TEXT[]` (null) |
| `Resource.type` | opcional con `?` | requerido | `NOT NULL` |
| `Resource.file_url` | opcional | `string \| null` | nullable |
| `Publication.cover_image` | opcional | `string \| null` | nullable |
| `Publication.published` | opcional | `boolean` (NOT NULL con default) | `NOT NULL` |
| `ProjectInsert` | `Omit<Project, ...>` | `Omit + professor_id` redundante | n/a |

`types/database.ts` no era importado por ningún archivo del repo (verificado con grep), por lo que era **código muerto**. Fue eliminado y `types/index.ts` se reescribió alineado con el esquema real (nullable en columnas que aceptan `null`, requeridos en `NOT NULL`).

También se unificó el uso: ya no se permite que `User.avatarUrl` sea `undefined` sin sentido — se mantiene opcional pero tipado contra `string | null` para ser consistente con la BD.

---

## 4. Problemas de seguridad encontrados

### 🔴 Crítico

1. **`uploadGalleryImage` escribía en el bucket equivocado** (`covers` en vez de `gallery`).
   - `src/services/projects.service.ts:170-178` (versión previa): `supabase.storage.from('covers').upload(...)`.
   - Impacto: las imágenes de galería se acumulaban en `covers/` mezclándose con portadas; además violaba el principio de menor privilegio (no había política de subida a `gallery/` por el camino correcto, pero sí para `covers/`). Con la nueva implementación, `uploadGalleryImage` usa `bucket: 'gallery'`, que es coherente con las políticas RLS de `supabase/storage.sql:140-180`.

2. **`updateProject` y `deleteProject` no verificaban ownership/role en el cliente**.
   - Antes: `updateProject(id, project)` simplemente hacía `.update().eq('id', id)` — confiaba 100% en RLS.
   - Si la RLS fallara (ej. un admin deshabilitándola, un bug en una migración), cualquier usuario autenticado podría modificar/eliminar proyectos ajenos.
   - Además, sin un check explícito en el servicio, el frontend no distingue entre "no existe", "no tienes permisos" y "otro error".
   - **Solución aplicada**: nueva función `requireProjectOwnership(projectId, userId, isAdmin)` que hace un `select('professor_id').eq('id', projectId).single()` y compara antes de update/delete. Admins pasan el check automáticamente.

### 🟠 Alto

3. **El listener `onAuthStateChange` se montaba *fuera* del `create()` de Zustand**, en un bloque `if (!authListener)` a nivel de módulo, lo cual se ejecutaba solo al importarse el módulo y era frágil ante HMR o tests.
   - Refactor: extraído a `initAuthListener()` llamado una vez al cargar el módulo, con guarda `if (authListener) return`.

4. **Falta de validación de MIME type y tamaño en uploads de proyectos**.
   - Antes: cualquier `File` (incluso de 50MB) llegaba a Supabase. El bucket `covers` no tiene límite de tamaño configurado.
   - **Solución aplicada**: helper `validateImage(file, label)` que valida tipo (image/jpeg, png, webp, gif) y tamaño (≤5MB), lanza `Error` con mensaje claro antes de tocar el storage.

5. **RLS en `resources` permite SELECT público a todos** (`supabase/rls.sql:95-97`).
   - Hoy parece intencional (los recursos son visibles para todos), pero si en el futuro se vuelven privados, habrá que migrar políticas. No es un bug, es una decisión de producto a documentar.

### 🟡 Medio

6. **`signUp` cuenta todos los perfiles (incluyendo admins) al validar el límite de 7 usuarios institucionales**.
   - En `auth.service.ts` (antes) y `useInstitutionalUsers.ts`: cuentan `count` sobre `profiles` sin filtrar por rol. Si un admin cuenta, se consume cupo.
   - Recomendación: filtrar `role IN ('teacher', 'admin')` o sólo `role != 'visitor'`. No aplicado en esta sesión (decisión de producto + requiere cambio de RLS para que usuarios anónimos puedan ver `count` filtrado por rol).

7. **No hay política DELETE en `storage.objects` para `gallery` y `covers` con restricción por propietario**.
   - `supabase/storage.sql:158-180, 204-226`: las políticas UPDATE/DELETE en `gallery` y `covers` permiten a *cualquier* teacher/admin borrar/actualizar *cualquier* objeto del bucket (no validan que sea el dueño).
   - Esto es un fallo de aislamiento entre profesores. **No corregido en esta sesión porque requiere migración SQL adicional.**

8. **`ProfileEditor` y `AvatarUpload` saltan la capa de servicios** y llaman `supabase` directamente.
   - No es estrictamente inseguro (la RLS lo cubre), pero rompe el patrón de la arquitectura. Marcado como refactor pendiente.

### 🟢 Bajo

9. **`authStore.persist` guardaba todo el estado** (`loading`, `error`, `initialized`, funciones) en `localStorage`. Las funciones son serializables pero inútiles tras hidratar; `loading`/`error`/`initialized` quedan stale.
   - **Solución aplicada**: añadido `partialize` para guardar solo `user` y `profile`.

10. **El `console.error` en bloques `catch` vacíos** (`authStore.ts:98-103` antes) ocultaba errores de fetch de perfil.
    - **Solución aplicada**: refactor del `fetchProfileAndBuildUser` con `maybeSingle()` (no lanza si no hay fila) y un único `catch` que limpia estado sin tragar errores silenciosamente.

---

## 5. Problemas de código y servicios

| # | Archivo | Problema | Estado |
|---|---|---|---|
| 1 | `auth.service.ts` | 14 `console.log`/`console.error` de depuración | ✅ Eliminados |
| 2 | `projects.service.ts` | 12 `console.log`/`console.error` de depuración | ✅ Eliminados |
| 3 | `useProjects.ts` | 2 `console.log` + `options: any` (perdía tipos) | ✅ Eliminados, tipado con `Parameters<>[0]` |
| 4 | `authStore.ts` | Bloque `if (!authListener) { supabase.auth.onAuthStateChange(...) }` a nivel de módulo, fuera del `create()`. | ✅ Extraído a `initAuthListener()` |
| 5 | `authStore.ts` | `catch` vacíos en `initialize` y en el listener | ✅ Reemplazados por helper `fetchProfileAndBuildUser` |
| 6 | `authStore.ts` | `persist()` guardaba funciones y flags en localStorage | ✅ `partialize` añadido |
| 7 | `authStore.ts` | Código duplicado entre `initialize` y el listener de `onAuthStateChange` | ✅ Deduplicado en `fetchProfileAndBuildUser` |
| 8 | `projects.service.ts` | `uploadGalleryImage` usaba `bucket: 'covers'` (bug crítico) | ✅ Cambiado a `bucket: 'gallery'` |
| 9 | `projects.service.ts` | `updateProject`/`deleteProject` sin check de ownership | ✅ Nueva firma con `context: { userId, isAdmin }` |
| 10 | `projects.service.ts` | Sin validación de tipo/tamaño en uploads | ✅ Helper `validateImage` añadido |
| 11 | `types/database.ts` | Archivo duplicado de tipos, contradictorio con `index.ts`, no importado en ningún sitio | ✅ Eliminado |
| 12 | `types/index.ts` | Tipos opcionales (`string?`) donde la BD permite `null` pero no `undefined` | ✅ Reescrito: nullable alineado con el esquema |
| 13 | `ProfileEditor.tsx` | Bloques comentados de `social_media` (código muerto) | ✅ Eliminados |
| 14 | `ProfileEditor.tsx` | `avatar_url: finalAvatarUrl` podía ser string vacío `''` en vez de `null` | ✅ Normalizado a `null` cuando vacío |
| 15 | `ProjectForm.tsx` | 8 `console.log` de depuración | ✅ Eliminados |
| 16 | `ProjectForm.tsx` | `coverImageUrl = project?.cover_image \|\| ''` mezclaba `''` con URLs reales | ✅ Tipado a `string \| null` |
| 17 | `ProjectForm.tsx` | Llamaba `updateProject(project.id, projectData)` sin contexto | ✅ Ahora pasa `{ userId, isAdmin }` |
| 18 | `ProjectsPage.tsx` | Llamaba `deleteProject(id)` sin contexto | ✅ Ahora pasa `{ userId, isAdmin }` |
| 19 | `auth.service.ts` | `getCurrentUser()` método duplicado/muerto (no se usaba en ningún sitio) | ✅ Eliminado |
| 20 | `auth.service.ts` | `getCurrentProfile()` no se usaba pero se mantuvo por si el frontend lo necesita | ✅ Conservado, tipado con retorno explícito `Promise<Profile \| null>` |

No corregido (fuera de alcance de "servicios y auth"):
- `useDashboardData`, `useDashboardStats`, `useProfessorStats`: hacen `console.error` legítimos, no `console.log` de depuración. Se dejaron.
- `AvatarUpload`: `console.error` legítimo en `catch`, no se tocó.
- `useInstitutionalUsers`: `console.error` legítimo, no se tocó.
- `public.service.ts`, `publications.service.ts`, `resources.service.ts`, `activities.service.ts`: limpios, sin `console.log` de depuración, sin bug alguno. Se dejaron tal cual (con la salvedad de que también carecen de check de ownership en update/delete — riesgo medio, ver §7).

---

## 6. Cambios realizados en esta sesión

### `src/types/index.ts` (reescrito completo)
- Reemplazado `string | undefined` por `string | null` en columnas nullable del esquema.
- `Resource.type`, `Publication.published` marcados como requeridos (NOT NULL en DB).
- `ProjectInsert`, `ResourceInsert`, `PublicationInsert`, `ActivityInsert` redefinidos como `Pick<...> & Partial<Omit<...>>` para que el caller esté obligado a pasar las columnas NOT NULL mínimas (`professor_id`, `title`, `slug` para proyectos; `type` para resources).
- `Project.professor` y similares tipados con `Pick<Profile, ...>` para reflejar exactamente lo que la query con `select(*, professor:profiles(...))` devuelve.
- `User.avatarUrl` ahora `string | null | undefined`.

### `src/types/database.ts` (eliminado)
- Archivo muerto no importado, contradecía `index.ts`.

### `src/services/auth.service.ts` (reescrito)
- Eliminados los 14 `console.log`/`console.error` de depuración.
- `MAX_INSTITUTIONAL_USERS` movido a constante de módulo (antes duplicado con `useInstitutionalUsers.ts`).
- `buildUserFromProfile` con tipo de retorno `User` (sin `as`).
- `signUp` refactorizado: sin session intermedia con `console.log`, `signInWithPassword` solo si no hay sesión.
- Eliminado `getCurrentUser()` (no usado en ningún archivo del repo, verificado con grep).
- `getCurrentProfile()` con tipo de retorno explícito.
- `getInstitutionalUsersCount` añadido como método público (antes solo estaba el conteo inline en `signUp`).

### `src/services/projects.service.ts` (reescrito)
- Eliminados los 12 `console.log`/`console.error` de depuración.
- `uploadGalleryImage` corregido: ahora usa `bucket: 'gallery'` y sube a la raíz (sin prefijo `gallery/`), coherente con la RLS.
- `uploadCoverImage` mantiene `bucket: 'covers'` con prefijo `covers/`.
- Añadido helper `validateImage(file, label)` que valida tipo (jpg/png/webp/gif) y tamaño (≤5MB) antes de subir.
- Nueva función privada `requireProjectOwnership(projectId, userId, isAdmin)` que hace un lookup de `professor_id` y compara antes de update/delete.
- Firmas nuevas: `updateProject(id, project, context)` y `deleteProject(id, context)`, donde `context = { userId: string; isAdmin: boolean }`.
- `getProjects` y `getProjectsByProfessor` ahora tipan el retorno como `(data ?? []) as Project[]` (antes confiaban en que `data` no era null).
- `getProjects` ya no aplica `limit` y `range` a la vez sin querer: la rama correcta solo aplica `range` cuando hay `page`, y solo `limit` cuando no.
- Select de `professor` añadido con `id` además de `full_name` y `avatar_url` (consistencia con el tipo).

### `src/services/public.service.ts` (sin cambios estructurales)
- Revisado. Sin `console.log`. `getPublicProjects` filtra por `status = 'published'`. El método `getRelatedProjects` tiene un filtrado client-side (marcado como "simplificado" en el código) que es ineficiente pero no incorrecto.
- Pendiente: refactor a query SQL con `technologies && ARRAY[...]` cuando crezca el dataset.

### `src/services/publications.service.ts` (sin cambios)
- Limpio, sin `console.log`. Sin check de ownership en update/delete (riesgo medio, ver §7).

### `src/services/resources.service.ts` (sin cambios)
- Limpio, sin `console.log`. Sin check de ownership en update/delete (riesgo medio, ver §7).

### `src/services/activities.service.ts` (sin cambios)
- Limpio, sin `console.log`. Sin check de ownership en update/delete (riesgo medio, ver §7).

### `src/store/authStore.ts` (reescrito)
- Bloque `if (!authListener) { supabase.auth.onAuthStateChange(...) }` que vivía a nivel de módulo (línea 163-198 de la versión previa, fuera del `create()`) extraído a `initAuthListener()` con guarda.
- Helper `fetchProfileAndBuildUser(userId, email)` deduplica la lógica entre `initialize` y el listener.
- `persist` ahora usa `partialize: (s) => ({ user: s.user, profile: s.profile })`.
- Tipos explícitos en las firmas internas.

### `src/hooks/useProjects.ts` (reescrito)
- Eliminados los 2 `console.log`.
- `options: any` reemplazado por `Parameters<typeof projectsService.getProjects>[0]`, que preserva el tipo exacto del servicio.
- `refetch` con tipo `() => Promise<void>`.
- `setTotalCount(result.count ?? 0)` — era `result.count ?? 0` pero ahora también `setProjects(result.data)` está protegido contra `data` undefined.

### `src/components/projects/ProjectForm.tsx` (modificado)
- Eliminados los 8 `console.log`.
- `coverImageUrl: string | null` (antes `string`, con `|| ''`).
- Llamada a `updateProject` ahora pasa `{ userId: user.id, isAdmin: user.role === 'admin' }`.
- Tipo de `createProject` cast simplificado.

### `src/pages/dashboard/projects/ProjectsPage.tsx` (modificado)
- Añadido `useAuthStore` para obtener `user`.
- `handleDelete` ahora llama `deleteProject(id, { userId, isAdmin })`.
- Captura el caso `!user?.id` antes de llamar al servicio.

### `src/components/profile/ProfileEditor.tsx` (reescrito)
- Bloques comentados de `social_media` eliminados (código muerto).
- `useEffect` comentado que reseteaba valores al cambiar perfil: eliminado.
- `avatarUrl: string | null` consistente con la BD.
- `setProfile(...)` en el store ahora se llama con un objeto `Profile` completo y bien tipado, con fallback seguro si `profile` es null.
- `console.error` reemplazado por `setError` (el `console.error` original era legítimo pero el `setError` ya cubre el feedback al usuario).

---

## 7. Recomendaciones prioritarias para siguientes prompts

Ordenadas por impacto:

1. **Añadir `requireOwnership` (o equivalente) en `publications.service`, `resources.service`, `activities.service`.** Hoy dependen solo de la RLS, que es correcta pero insuficiente para dar mensajes de error útiles al usuario. (Riesgo: medio)

2. **Endurecer las políticas DELETE/UPDATE de `storage.objects` para `gallery` y `covers`** verificando que el path empiece por `${userId}/` o un prefijo por dueño. (Riesgo: medio — profesores pueden borrarse archivos entre sí).

3. **Migrar `ProfileEditor` y `AvatarUpload` a un `profile.service.ts` y un `avatar.service.ts`** que envuelvan las llamadas directas a `supabase`. Mantiene una única capa de servicio. (Riesgo: bajo — refactor).

4. **Reemplazar el truco de `signInWithPassword` post-`signUp` en `auth.service`** por un trigger SQL (`handle_new_user`) que cree la fila en `profiles` automáticamente. Esto evita el doble round-trip y elimina la condición de carrera donde un usuario se registra pero su perfil queda huérfano si el segundo `signIn` falla. (Riesgo: bajo — robustez).

5. **Reemplazar `getInstitutionalUsersCount` por una RPC `count_institutional_users()`** que devuelva sólo `count(*) where role in ('teacher','admin')` con permisos para `anon`. Evita exponer el conteo total de la tabla `profiles` (incluyendo admins/visitantes) a usuarios no autenticados en la página de registro. (Riesgo: medio — privacidad).

6. **Añadir tests unitarios para los servicios** (Vitest ya debería estar disponible — verificar `package.json`). Mínimo: `auth.service.signUp` con el límite de 7, `projectsService.updateProject` con owner vs. no-owner vs. admin, `uploadGalleryImage` con archivo inválido. (Riesgo: bajo — calidad).

7. **Revisar y eliminar los `console.log` restantes** en componentes de UI (`AuthProvider`, `EmptyProjects`, `QuickActions`, `DashboardWelcomeHeader`) — fuera del alcance de esta auditoría pero visibles en `grep`.

8. **Considerar el `setError` que nunca se lee**: en `authStore`, `error` se setea pero `useAuth.ts` ya tiene su propio `error` local. Consolidar para evitar doble fuente de verdad. (Riesgo: bajo — DX).

---

## 8. Estado final

✅ **Listo para continuar con el frontend.**

- TypeScript compila sin errores (`tsc --noEmit` pasa).
- Servicios críticos (`auth`, `projects`) limpios, sin `console.log`, con tipado estricto y validación de ownership.
- Tipos unificados y alineados con la BD real.
- Store de auth sin código muerto ni bloques vacíos.
- Hooks principales sin ruido de depuración.

**Blockers restantes**: ninguno. Los puntos del §7 son mejoras incrementales, no bloquean el desarrollo de UI.
