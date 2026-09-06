# REPORTE_FIX_RUNTIME.md

## 1. Path storage (antes/después)

### Bug
`uploadCoverImage` y `uploadGalleryImage` en `src/services/projects.service.ts` generaban paths con prefijo duplicado:

```ts
// ANTES
const filePath = `covers/${userId}/${fileName}`
// .from('covers') ya pone el bucket, así que Supabase recibía:
// covers/covers/{userId}/{file}.png  → 400

const filePath = `gallery/${userId}/${fileName}`
// .from('gallery') ya pone el bucket, así que Supabase recibía:
// gallery/gallery/{userId}/{file}.jpg  → 400
```

### Fix
```ts
// DESPUÉS
const filePath = `${userId}/${fileName}`
// .from('covers') → covers/{userId}/{file}.png  ✓
// .from('gallery') → gallery/{userId}/{file}.jpg  ✓
```

### Archivo tocado
- `src/services/projects.service.ts` líneas 156 y 176

### Confirmación
- `getPublicUrl(filePath)` recibe el mismo path corto `${userId}/${fileName}`.
- No se usa `crypto.randomUUID` como id de proyecto (se mantiene `Date.now()`).

---

## 2. Auth freeze (causa raíz + qué cambió)

### Causa raíz
En `src/store/authStore.ts`, la función `initAuthListener` maneja el evento `INITIAL_SESSION`:

```ts
// ANTES
if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
  if (!session?.user) return  // BUG: retorna sin hacer nada
  const { user, profile } = await fetchProfileAndBuildUser(...)
  useAuthStore.setState({ user, profile, loading: false, initialized: true })
}
```

Cuando `INITIAL_SESSION` dispara sin usuario (no hay sesión activa), el callback retornaba early sin actualizar el estado. Esto dejaba `loading: true` e `initialized: false` permanentemente, congelando el dashboard en "Verificando sesión...".

### Fix
```ts
// DESPUÉS
if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
  if (session?.user) {
    const { user, profile } = await fetchProfileAndBuildUser(session.user.id, session.user.email)
    useAuthStore.setState({ user, profile, loading: false, initialized: true })
  } else {
    // Ahora maneja el caso sin sesión
    useAuthStore.setState({ user: null, profile: null, loading: false, initialized: true })
  }
}
```

### Archivos tocados
- `src/store/authStore.ts` — `initAuthListener` ahora setea `loading: false, initialized: true` tanto para sesión existente como para sesión vacía.

### Reglas cumplidas
- `persist` solo guarda datos (`user`, `profile`), no funciones.
- Un solo listener de `onAuthStateChange` (el module-level `initAuthListener`).
- `getSession()` en `initialize()` siempre termina con `loading: false` en try/catch/finally.
- Si la sesión en localStorage está corrupta, `initialize()` la captura en `catch`, hace signOut implícito (seteando `user: null`), `loading: false`, sin crash.

---

## 3. Sidebar active

### Bug
En `src/components/layout/Sidebar.tsx`:

```ts
// ANTES
const isActive = location.pathname === item.href || location.pathname.startsWith(item.href)
```

En `/dashboard/resources`:
- `location.pathname.startsWith('/dashboard')` → true para "Dashboard"
- `location.pathname.startsWith('/dashboard/resources')` → true para "Mis Recursos"

Ambos ítems se marcaban activos simultáneamente.

### Fix
```ts
// DESPUÉS
const isDashboardRoot = item.href === '/dashboard' || item.href === '/dashboard/'
const isActive = isDashboardRoot
  ? location.pathname === '/dashboard' || location.pathname === '/dashboard/'
  : location.pathname === item.href || location.pathname.startsWith(item.href + '/')
```

Ahora:
- "Dashboard" solo se activa en `/dashboard` exacto.
- "Mis Recursos" solo se activa en `/dashboard/resources` o subrutas.
- Un solo ítem activo a la vez.

### Archivo tocado
- `src/components/layout/Sidebar.tsx`

---

## 4. Navbar pública

### Cambios en `src/components/public/PublicNavbar.tsx`

**Desktop:**
- Eliminado enlace "Mis Proyectos".
- Eliminado botón "Iniciar sesión".
- Si usuario autenticado: único CTA "Ir al panel" → `/dashboard`.
- Si visitante no autenticado: solo enlaces de `publicNavigation` (Inicio, Proyectos, Publicaciones, Acerca de).

**Mobile:**
- Eliminado enlace "Mis Proyectos" del menú.
- Eliminado botón "Iniciar sesión" del menú.
- Si usuario autenticado: muestra "Ir al panel" → `/dashboard`.
- Si visitante no autenticado: menú solo con `publicNavigation`.

### Antes
```tsx
// Desktop
<Link to={user ? '/dashboard/projects' : '/login'}>Mis Proyectos</Link>
<div>
  {user ? (
    <>
      <span>{user.fullName}</span>
      <Link to="/dashboard">Dashboard</Link>
    </>
  ) : (
    <>
      <Link to="/register">Registrarse</Link>
      <Link to="/login">Iniciar sesión</Link>
    </>
  )}
</div>
```

### Después
```tsx
// Desktop
{user && <Link to="/dashboard">Ir al panel</Link>}

// Mobile
{user && (
  <>
    <div>{user.fullName}</div>
    <Link to="/dashboard">Ir al panel</Link>
  </>
)}
```

---

## 5. Home sección

### Bug
`src/components/public/PublicStats.tsx` usaba `<section className="py-12 bg-navy-50/30">` en ambos estados (loading y loaded). El fondo `bg-navy-50/30` creaba una franja verde/clara vacía entre secciones, duplicando el fondo del layout.

### Fix
Se eliminó `bg-navy-50/30` de ambas secciones en `PublicStats.tsx`:

```tsx
// ANTES
<section className="py-12 bg-navy-50/30">

// DESPUÉS
<section className="py-12">
```

Las tarjetas de estadísticas ya tienen su propio fondo blanco y borde, por lo que el fondo de sección era redundante.

### Archivo tocado
- `src/components/public/PublicStats.tsx`

---

## 6. tsc

**Estado: OK — 0 errores**

```
npx tsc --noEmit
```

Comando ejecutado después de todos los fixes. Sin errores de tipado.

---

## 7. Cómo probar

### Storage path
1. Crear/editar un proyecto desde el dashboard.
2. Subir imagen de portada o imagen de galería.
3. Verificar en la consola de red que la URL de upload no contiene el prefijo duplicado:
   - `POST .../storage/v1/object/covers/{userId}/{file}.png` (NO `covers/covers/...`)
   - `POST .../storage/v1/object/gallery/{userId}/{file}.jpg` (NO `gallery/gallery/...`)

### Auth freeze
1. Abrir app en incógnito o limpiar localStorage.
2. Ir a `/login` y autenticarse.
3. Verificar redirección a `/dashboard` en < 3 segundos.
4. Recargar página con sesión activa: debe cargar el dashboard sin quedar en "Verificando sesión...".
5. Si la sesión está corrupta: debe redirigir a `/login` sin quedar colgado.

### Sidebar active
1. Ir a `/dashboard`.
2. Verificar que solo "Dashboard" está activo.
3. Ir a `/dashboard/resources`.
4. Verificar que solo "Mis Recursos" está activo (NO "Dashboard").
5. Repetir para `/dashboard/publications`, `/dashboard/activities`, `/dashboard/profile`.

### Navbar pública
1. Abrir `/` sin autenticar.
2. Verificar navbar: Inicio / Proyectos / Publicaciones / Acerca de. Sin "Mis Proyectos", sin "Iniciar sesión".
3. Autenticarse.
4. Verificar navbar: Inicio / Proyectos / Publicaciones / Acerca de + botón "Ir al panel".
5. En mobile, menú hamburguesa debe tener el mismo comportamiento.

### Home sección
1. Abrir `/`.
2. Verificar que no hay franja verde vacía entre `PublicStats` y `FeaturedProjects`.
3. Verificar que las estadísticas se muestran correctamente sobre el fondo blanco.
