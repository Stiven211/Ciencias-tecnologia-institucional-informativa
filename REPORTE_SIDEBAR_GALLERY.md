# Reporte: Sidebar mobile + galería post-creación + limpieza ProfessorProfile

## 1. Resumen

Se cerraron 3 issues pendientes de `REPORTE_BUGS_PRODUCTO.md`:

1. **Sidebar mobile conectado al Navbar**: una sola barra superior, con botón hamburguesa visible solo en `lg:hidden`. El overlay y el Sidebar existentes se reutilizan; al clickear un link del sidebar se cierra automáticamente.
2. **Galería con id real**: `ProjectForm` ahora crea/edita el proyecto primero, sube imágenes con el `id` real y luego persiste las URLs. No quedan `crypto.randomUUID()` en paths de storage.
3. **ProfessorProfilePage limpia**: reemplazada la llamada directa a `supabase.from('projects')` por `projectsService.getProjectsByProfessor(id)` + filtrado client-side por `status === 'published'`.

`tsc --noEmit` no se pudo ejecutar por falta de `node_modules`. Documentado.

## 2. Contrato Navbar ↔ Layout (props)

### `DashboardLayout`
- Estado interno: `mobileSidebarOpen` / `setMobileSidebarOpen`.
- Callbacks:
  - `openSidebar = () => setMobileSidebarOpen(true)`
  - `closeSidebar = () => setMobileSidebarOpen(false)`

### `Navbar`
- Props nuevas: `onOpenSidebar?: () => void`
- Comportamiento:
  - Si `onOpenSidebar` está definido, renderiza un botón `<Menu />` con clases `lg:hidden` (solo mobile).
  - Desktop (`lg+`): el botón no aparece; el sidebar sigue fijo a la izquierda.
  - El botón hamburguesa dispara `onOpenSidebar`.

### `Sidebar`
- Props nuevas: `onNavigate?: () => void`
- Comportamiento:
  - Cada `<Link>` del sidebar recibe `onClick={onNavigate}`.
  - En desktop, `DashboardLayout` no pasa `onNavigate`, así que los links no cierran nada (el sidebar es permanente).
  - En mobile, `DashboardLayout` pasa `onNavigate={closeSidebar}` al `Sidebar` dentro del overlay. Al clickear cualquier link, se cierra el overlay.

### Flujo completo en mobile
1. Usuario pulsa ☰ en `Navbar` → `onOpenSidebar()` → `mobileSidebarOpen = true`.
2. Se renderiza overlay + `Sidebar` con `onNavigate={closeSidebar}`.
3. Usuario clickea un link del sidebar → navega y cierra overlay.
4. Usuario clickea fuera del sidebar (overlay negro) → `closeSidebar` → overlay cierra.

## 3. Flujo galería create/edit

### Antes
`GalleryUpload` recibía `projectId={project?.id || 'new'}` y subía internamente con ese valor. En creación, si el usuario pulsaba “Subir X imágenes” antes de guardar el proyecto, se generaba un path `gallery/<userId>/new-...` y quedaba un archivo huérfano.

### Ahora
- `GalleryUpload` mantiene la UI (selección múltiple, previews, eliminación).
- El botón “Subir X imágenes” sigue existiendo pero ahora:
  - Si `projectId === 'new'`, está deshabilitado y muestra error “Primero debes guardar el proyecto para subir imágenes.”
  - Si `projectId !== 'new'`, funciona igual que antes (subida manual opcional en edición).

### Flujo CREATE en `ProjectForm`
1. Usuario completa formulario + selecciona archivos de galería (`galleryFiles`).
2. Submit:
   - Crea proyecto **sin** `gallery_images` (`[]`).
   - Obtiene `savedProject.id`.
   - Sube portada (si hay) con `savedProject.id`.
   - Sube cada archivo de `galleryFiles` con `savedProject.id`.
   - Hace `updateProject` con `gallery_images: [url1, url2, ...]`.
3. Si falla la galería:
   - El proyecto ya existe.
   - Mensaje: *“El proyecto se creó pero la galería no se subió. Puedes editarlo y volver a subirla.”*
   - Redirige a `/dashboard/projects/{id}/edit`.

### Flujo EDIT en `ProjectForm`
1. Usuario modifica campos + agrega/elimina imágenes.
2. Submit:
   - Actualiza proyecto con texto + `gallery_images` actual (sin archivos nuevos).
   - Sube cada archivo nuevo de `galleryFiles` con `project.id`.
   - Hace `updateProject` con `gallery_images: [...galleryImages, ...newUrls]`.
3. Si falla la galería:
   - El texto ya está guardado.
   - Mensaje: *“El proyecto se actualizó pero la galería no se subió. Puedes editar y volver a intentarlo.”*
   - Permanece en la página de edición.

### Archivos modificados
- `src/components/projects/ProjectForm.tsx` — submit reordenado; nuevo estado `galleryFiles`.
- `src/components/projects/GalleryUpload.tsx` — props actualizadas (`files`, `onFilesChange`, `onImagesChange`); botón deshabilitado en creación.

### Detalle técnico
`GalleryUpload` ya no llama a `onChange` con URLs mixtas. Ahora:
- `onImagesChange` → solo URLs (manejado por `ProjectForm`).
- `onFilesChange` → solo `File` objects pendientes (manejado por `ProjectForm`).
Esto permite que `ProjectForm` controle cuándo y con qué `id` se suben.

## 4. ProfessorProfilePage

### Antes
```ts
const [{ data: profileData }, { data: projectsData }] = await Promise.all([
  profileService.getProfileById(id),
  supabase.from('projects').select('*').eq('professor_id', id).eq('status', 'published'),
])
setProjects(projectsData.data || [])
```

### Ahora
```ts
const [profileData, projectsData] = await Promise.all([
  profileService.getProfileById(id),
  projectsService.getProjectsByProfessor(id),
])
setProfile(profileData)
setProjects(projectsData.filter(p => p.status === 'published'))
```

### Cambios
- Eliminado import de `supabase`.
- Usa `projectsService.getProjectsByProfessor(id)`.
- Filtrado client-side por `status === 'published'` (la página pública solo muestra proyectos publicados).
- No se modifica el diseño ni la estructura del componente.

### Verificación
```bash
$ rg "supabase\.from\(['\"]" src/pages/public/ProfessorProfilePage.tsx
(no matches)
```

## 5. Cómo probar en mobile

### Sidebar + Navbar
1. Abrir DevTools → Device Toolbar → emular móvil (ancho < 1024px).
2. Ir a `/dashboard`.
3. Debe aparecer **una sola** barra blanca en la parte superior: el `Navbar`.
4. En el lado izquierdo de la barra debe haber un botón ☰ (`Menu`).
5. Click en ☰ → se abre el overlay oscuro + el `Sidebar` nav dark.
6. Click en cualquier link del sidebar → navega y el overlay se cierra.
7. Click fuera del sidebar (zona oscura) → overlay se cierra.
8. Girar/agrandar a `lg+` → desaparece el botón ☰, reaparece el sidebar fijo a la izquierda.

### Galería post-creación
1. Ir a `/dashboard/projects/new`.
2. Completar formulario + seleccionar varias imágenes de galería.
3. Pulsar “Crear proyecto”.
4. El proyecto se crea, las imágenes se suben con el `id` real y se redirige a la lista.
5. Abrir el proyecto recién creado en Supabase Storage → verificar que las imágenes están en `gallery/<userId>/<projectId>-...`.
6. Repetir pero simulando fallo de red (offline) durante la subida de galería:
   - El proyecto se crea.
   - Se muestra error honesto.
   - Se redirige a edit.
   - En edición, pulsar “Subir X imágenes” (ahora el botón está habilitado porque `projectId` es real) y completar la subida.

### ProfessorProfilePage
1. Ir a `/profesor/<id-de-un-profesor>`.
2. La página carga el perfil y sus proyectos publicados.
3. Abrir Network tab → verificar que la llamada a `projectsService.getProjectsByProfessor` se hace correctamente.
4. No debe haber llamadas a `supabase.from('projects')` en el código de la página.

## 6. Pendientes

1. **Botón de subir galería redundante**: `GalleryUpload` sigue teniendo un botón “Subir X imágenes” manual. En creación está deshabilitado (correcto), pero en edición el usuario podría usarlo o confundirlo con la subida automática del submit. Futuro: unificar en un solo flujo (que `ProjectForm` siempre suba en el submit y `GalleryUpload` solo sea preview).
2. **Sidebar en desktop**: el botón hamburguesa está oculto en `lg+`, pero el sidebar desktop sigue mostrándose. No hay forma de colapsarlo en desktop salvo el botón interno del `Sidebar` (flechas). Eso ya existía; no se tocó.
3. **Filtrado de proyectos por profesor**: `ProfessorProfilePage` filtra client-side por `status === 'published'`. Si la cantidad de proyectos crece, conviene mover ese filtro a `projectsService.getProjectsByProfessor` o a un método específico en `publicService`.
4. **TS**: `npm install && npm run build` para validar tipos tras los cambios de props (`NavbarProps`, `SidebarProps`, `GalleryUploadProps`).
5. **`Menu` icon en Navbar**: se importa solo para el botón mobile. Ya está condicionado con `{onOpenSidebar && ...}`; no sobra en desktop.

## 7. Verificación de código

```bash
# No debe quedar supabase.from en pages/ ni components/
$ rg "supabase\.from\(['\"]" src/pages src/components
(no matches)

# No debe quedar crypto.randomUUID en src/
$ rg "crypto\.randomUUID\(" src
(no matches en código; solo en reportes antiguos)
```