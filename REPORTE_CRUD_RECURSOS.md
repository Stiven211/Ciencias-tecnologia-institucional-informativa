# REPORTE_CRUD_RECURSOS.md

## 1. Resumen

Se implementó el CRUD completo de Recursos en el dashboard del profesor, siguiendo el patrón de Proyectos:
- **Rutas y nav**: se añadieron rutas protegidas y el ítem "Mis Recursos" en el sidebar.
- **Servicio**: se extendió `resources.service.ts` con `getResourceById`, `getMyResources`, `getAllResources` y `uploadResourceFile` (con validación de mime y tamaño).
- **Listado**: `ResourcesPage` con búsqueda, paginación, estado vacío honesto, y toggle "Ver todos" para admin.
- **Formulario**: `ResourceForm` reutiliza `Input`, `Button`, estilos nativos. Maneja `document | video | link | image` con URL para enlaces y archivo para los demás tipos.
- **Create/Edit**: páginas con estado `loading | not-found | forbidden | error | ready` y ownership check.
- **Eliminar**: `DeleteResourceModal` con confirmación.
- **QuickActions**: se añadió CTA a "Mis Recursos".

No se tocaron políticas SQL, no se habilitó catálogo público y no se rediseñó la UI.

---

## 2. Rutas + nav

### Rutas añadidas (`src/App.tsx`)

| Ruta | Componente | Protección |
|------|-----------|------------|
| `/dashboard/resources` | `ResourcesPage` | `ProtectedRoute` (dashboard) |
| `/dashboard/resources/new` | `CreateResourcePage` | `create_resource` |
| `/dashboard/resources/:id/edit` | `EditResourcePage` | `edit_own_resource` |

### Nav (`src/config/navigation.ts`)

```ts
{
  name: 'Mis Recursos',
  href: '/dashboard/resources',
  icon: FileText,
  permission: 'create_resource'
}
```

Visible para `teacher` y `admin` (ambos tienen `create_resource` en `PERMISSIONS`).

### Permisos añadidos (`src/config/permissions.ts`)

- `create_resource`
- `edit_own_resource`
- `delete_own_resource`

Asignados a `admin` y `teacher`.

---

## 3. API del servicio (paths de storage)

### Métodos añadidos/modificados en `src/services/resources.service.ts`

| Método | Query | Retorno |
|--------|-------|---------|
| `getResourceById(id)` | `select(*, professor:profiles(...)).eq('id', id).single()` | `Promise<Resource>` |
| `getMyResources(userId)` | `select(*, professor:profiles(...)).eq('professor_id', userId).order('created_at')` | `Promise<Resource[]>` |
| `getAllResources()` | `select(*, professor:profiles(...)).order('created_at')` | `Promise<Resource[]>` |
| `uploadResourceFile(file, resourceId, userId)` | `storage.from('resources').upload(path, file)` | `Promise<string>` (public URL) |

### Path de storage en upload

```
Bucket: resources
Path:   {userId}/{resourceId}-{timestamp}.{ext}
```

Ejemplo: `a1b2c3d4-1111-2222-3333-444455556666/9879fc30-1234-...-1699123456789.pdf`

- **Sin prefijo extra** `resources/` dentro del bucket.
- Se usa `Date.now()` como timestamp, no `crypto.randomUUID()`.
- El `resourceId` se obtiene de la fila creada previamente.

### Validación en `uploadResourceFile`

| Tipo | Mime permitido | Tamaño máx |
|------|---------------|-----------|
| `document` | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain` | 20MB |
| `image` | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | 5MB |
| `video` | `video/mp4`, `video/webm`, `video/ogg` | 50MB |

El tipo se infiere del MIME del archivo. Si no coincide con `image/*` ni `video/*`, se trata como `document`.

---

## 4. Flujo create (orden: insert → upload → update)

1. **Insert**: se crea la fila en `resources` con `file_url: null`, `professor_id`, `title`, `type`, `description`.
2. **Upload**: se sube el archivo a `storage.from('resources')` con path `{userId}/{resourceId}-{timestamp}.{ext}`.
3. **Update**: se actualiza la fila con la `publicUrl` retornada en `file_url`.

Flujo para `type = link`:
1. **Insert/Update directo**: se guarda la URL ingresada en `file_url`. No hay upload.

Flujo para **edit** con archivo nuevo:
1. **Upload** del nuevo archivo.
2. **Update** de la fila con la nueva URL en `file_url`.

---

## 5. Cómo probar

### Requisitos previos
- Estar logueado como `teacher` o `admin`.
- El bucket `resources` existe en Supabase Storage (ya está creado en `supabase/storage.sql`).
- Políticas actuales permiten INSERT a `teacher/admin` (sin ownership check por path, como está actualmente).

### Flujo de prueba manual

1. **Navegación**
   - Ir a `/dashboard/resources`.
   - Verificar que aparece "Mis Recursos" en el sidebar.
   - Verificar que el botón "Nuevo recurso" dirige a `/dashboard/resources/new`.

2. **Crear recurso (documento)**
   - Click en "Nuevo recurso".
   - Título: `Prueba recurso 1`.
   - Tipo: `document`.
   - Archivo: seleccionar un PDF < 20MB.
   - Descripción: `Recurso de prueba`.
   - Enviar.
   - Verificar redirección a `/dashboard/resources`.
   - Verificar que aparece en la lista con badge "Documento".

3. **Crear recurso (enlace)**
   - Click en "Nuevo recurso".
   - Título: `Prueba enlace`.
   - Tipo: `link`.
   - URL: `https://ejemplo.com`.
   - Sin archivo.
   - Enviar.
   - Verificar que aparece en la lista con badge "Enlace" y la URL se almacena.

4. **Editar recurso**
   - Click en ícono de edición de un recurso.
   - Modificar título o descripción.
   - Cambiar tipo a `image` y subir una imagen.
   - Enviar.
   - Verificar que los cambios se reflejan.

5. **Editar recurso (cambiar a link)**
   - Editar un recurso de tipo documento.
   - Cambiar tipo a `link`.
   - Ingresar URL.
   - Enviar.
   - Verificar que `file_url` ahora contiene la URL.

6. **Eliminar recurso**
   - Click en ícono de eliminar.
   - Confirmar en el modal.
   - Verificar que desaparece de la lista.

7. **Admin: ver todos**
   - Loguearse como admin.
   - Ir a `/dashboard/resources`.
   - Verificar botón "Ver todos".
   - Click en "Ver todos" y confirmar que aparecen recursos de todos los profesores.
   - Verificar que puede editar/eliminar recursos ajenos.

8. **Profesor: ver solo los suyos**
   - Loguearse como teacher.
   - Ir a `/dashboard/resources`.
   - Verificar que no aparece botón "Ver todos".
   - Verificar que solo ve sus propios recursos.

9. **Búsqueda**
   - Crear varios recursos con títulos distintos.
   - Usar el buscador en la lista.
   - Verificar que filtra por título y descripción.

10. **Estados vacíos**
    - Sin recursos: verificar mensaje honesto "No hay recursos" con CTA.
    - En edición con ID inexistente: verificar "Recurso no encontrado".
    - En edición de recurso ajeno (sin ser admin): verificar "Sin permisos".

---

## 6. Pendientes

- [ ] **Catálogo público de recursos**: actualmente el CRUD es solo dashboard. Hacer una página pública tipo `PublicResourcesGrid` queda fuera de esta tarea.
- [ ] **Políticas SQL de storage para bucket `resources`**: las políticas actuales permiten INSERT/UPDATE/DELETE a cualquier `teacher/admin` sin verificar `storage.foldername(name)[1] = auth.uid()`. Cuando se implementen uploads y se verifique la convención de paths, endurecer políticas con ownership check.
- [ ] **Eliminación de archivo huérfano en storage**: al editar un recurso y subir un nuevo archivo, el anterior permanece en el bucket. Considerar limpiar archivos antiguos.
- [ ] **Detalle público de recurso**: no existe página de detalle público aún.
- [ ] **Typecheck**: no se pudo ejecutar `tsc` porque `typescript` no está instalado en `node_modules` (`npm run build` falla con `Cannot find module ... typescript/bin/tsc`). Pendiente instalar dependencias o verificar en entorno con `node_modules` completo.
