# REPORTE_CRUD_PUBLICACIONES.md

## 1. Resumen

Se implementó el CRUD completo de Publicaciones en el dashboard del profesor, siguiendo el patrón de Recursos:
- **Rutas y nav**: se añadieron rutas protegidas y el ítem "Publicaciones" en el sidebar.
- **Servicio**: se extendió `publications.service.ts` con `getPublicationById`, `getMyPublications`, `getAllPublications` y `uploadPublicationFile` (con validación de mime y tamaño).
- **Listado**: `PublicationsPage` con búsqueda, paginación, estado vacío honesto, y toggle "Ver todas" para admin.
- **Formulario**: `PublicationForm` alineado al schema real (`title`, `excerpt`, `content`, `cover_image`, `published`, `published_at`). Flujo `insert → upload → update`.
- **Create/Edit**: páginas con estado `loading | not-found | forbidden | error | ready` y ownership check.
- **Eliminar**: `DeletePublicationModal` con confirmación.
- **QuickActions**: se añadió CTA a "Publicaciones".

No se tocaron políticas SQL, no se habilitó catálogo público y no se rediseñó la UI.

---

## 2. Columnas reales usadas (del schema)

### `supabase/schema.sql` — tabla `publications`

```sql
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Columnas usadas en el CRUD

| Columna | Tipo | Uso en formulario |
|---------|------|-------------------|
| `id` | UUID | PK, generada por DB |
| `professor_id` | UUID | FK a `profiles(id)`, se asigna en create |
| `title` | TEXT NOT NULL | Input de texto, requerido, mín 3 caracteres |
| `excerpt` | TEXT | Textarea opcional (resumen/extracto) |
| `content` | TEXT | Textarea opcional (contenido completo) |
| `cover_image` | TEXT | Input file (imagen), opcional. Se almacena URL pública |
| `published` | BOOLEAN DEFAULT false | Checkbox "Publicado" |
| `published_at` | TIMESTAMP WITH TIME ZONE | Input date, opcional |
| `created_at` | TIMESTAMP | Auto-generado por DB |
| `updated_at` | TIMESTAMP | Auto-actualizado por trigger |

No se usan columnas inexistentes como `slug`, `status`, `categories`, `technologies`, `gallery_images`, etc.

---

## 3. Rutas + nav

### Rutas añadidas (`src/App.tsx`)

| Ruta | Componente | Protección |
|------|-----------|------------|
| `/dashboard/publications` | `PublicationsPage` | `ProtectedRoute` (dashboard) |
| `/dashboard/publications/new` | `CreatePublicationPage` | `create_publication` |
| `/dashboard/publications/:id/edit` | `EditPublicationPage` | `edit_own_publication` |

### Nav (`src/config/navigation.ts`)

```ts
{
  name: 'Publicaciones',
  href: '/dashboard/publications',
  icon: BookOpen,
  permission: 'create_publication'
}
```

Visible para `teacher` y `admin`.

### Permisos añadidos (`src/config/permissions.ts`)

- `create_publication`
- `edit_own_publication`
- `delete_own_publication`

Asignados a `admin` y `teacher`.

---

## 4. API + path de storage

### Métodos añadidos/modificados en `src/services/publications.service.ts`

| Método | Query | Retorno |
|--------|-------|---------|
| `getPublicationById(id)` | `select(*, professor:profiles(...)).eq('id', id).single()` | `Promise<Publication>` |
| `getMyPublications(userId)` | `select(*, professor:profiles(...)).eq('professor_id', userId).order('created_at')` | `Promise<Publication[]>` |
| `getAllPublications()` | `select(*, professor:profiles(...)).order('created_at')` | `Promise<Publication[]>` |

### Path de storage en upload

```
Bucket: publications
Path:   {userId}/{publicationId}-{timestamp}.{ext}
```

Ejemplo: `a1b2c3d4-1111-2222-3333-444455556666/9879fc30-1234-...-1699123456789.jpg`

- **Sin prefijo extra** `publications/` dentro del bucket.
- Se usa `Date.now()` como timestamp, no `crypto.randomUUID()`.
- El `publicationId` se obtiene de la fila creada previamente.

### Validación en `uploadPublicationFile`

| Tipo | Mime permitido | Tamaño máx |
|------|---------------|-----------|
| `image/*` | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | 5MB |
| `document` | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain` | 20MB |

El tipo se infiere del MIME del archivo solo para aplicar límites. El campo `published` y `published_at` se manejan desde el formulario.

---

## 5. Flujo create

1. **Insert**: se crea la fila en `publications` con `cover_image: null`, `professor_id`, `title`, `excerpt`, `content`, `published`, `published_at`.
2. **Upload**: se sube el archivo a `storage.from('publications')` con path `{userId}/{publicationId}-{timestamp}.{ext}`.
3. **Update**: se actualiza la fila con la `publicUrl` retornada en `cover_image`.

Flujo para **edit** con archivo nuevo:
1. **Upload** del nuevo archivo.
2. **Update** de la fila con la nueva URL en `cover_image`.

---

## 6. Cómo probar

### Requisitos previos
- Estar logueado como `teacher` o `admin`.
- El bucket `publications` existe en Supabase Storage.
- Políticas actuales permiten INSERT a `teacher/admin`.

### Flujo de prueba manual

1. **Navegación**
   - Ir a `/dashboard/publications`.
   - Verificar que aparece "Publicaciones" en el sidebar.
   - Verificar que el botón "Nueva publicación" dirige a `/dashboard/publications/new`.

2. **Crear publicación**
   - Click en "Nueva publicación".
   - Título: `Prueba publicación 1`.
   - Extracto: `Resumen de prueba`.
   - Contenido: `Contenido completo de prueba`.
   - Portada: seleccionar una imagen < 5MB.
   - Publicado: checkbox marcado.
   - Fecha de publicación: seleccionar fecha.
   - Enviar.
   - Verificar redirección a `/dashboard/publications`.
   - Verificar que aparece en la lista con badge "Publicado".

3. **Crear borrador**
   - Click en "Nueva publicación".
   - Título: `Borrador de prueba`.
   - Sin portada.
   - Publicado: sin marcar.
   - Enviar.
   - Verificar que aparece con badge "Borrador".

4. **Editar publicación**
   - Click en ícono de edición.
   - Modificar título o extracto.
   - Subir nueva portada.
   - Cambiar estado a "Publicado".
   - Enviar.
   - Verificar que los cambios se reflejan.

5. **Eliminar publicación**
   - Click en ícono de eliminar.
   - Confirmar en el modal.
   - Verificar que desaparece de la lista.

6. **Admin: ver todas**
   - Loguearse como admin.
   - Ir a `/dashboard/publications`.
   - Verificar botón "Ver todas".
   - Click y confirmar que aparecen publicaciones de todos los profesores.
   - Verificar que puede editar/eliminar publicaciones ajenas.

7. **Profesor: ver solo las suyas**
   - Loguearse como teacher.
   - Ir a `/dashboard/publications`.
   - Verificar que no aparece botón "Ver todas".
   - Verificar que solo ve sus propias publicaciones.

8. **Búsqueda**
   - Crear varias publicaciones con títulos distintos.
   - Usar el buscador en la lista.
   - Verificar que filtra por título y extracto.

9. **Estados vacíos**
   - Sin publicaciones: verificar mensaje honesto "No hay publicaciones" con CTA.
   - En edición con ID inexistente: verificar "Publicación no encontrada".
   - En edición de publicación ajena (sin ser admin): verificar "Sin permisos".

---

## 7. Pendientes

- [ ] **Catálogo público de publicaciones**: actualmente el CRUD es solo dashboard. Hacer una página pública queda fuera de esta tarea.
- [ ] **Políticas SQL de storage para bucket `publications`**: las políticas actuales permiten INSERT/UPDATE/DELETE a cualquier `teacher/admin` sin verificar `storage.foldername(name)[1] = auth.uid()`. Cuando se implementen uploads y se verifique la convención de paths, endurecer políticas con ownership check.
- [ ] **Eliminación de archivo huérfano en storage**: al editar una publicación y subir nueva portada, la anterior permanece en el bucket. Considerar limpiar archivos antiguos.
- [ ] **Typecheck**: no se pudo ejecutar `tsc --noEmit` porque `typescript` no está instalado en `node_modules` local. Pendiente instalar dependencias o verificar en entorno con `node_modules` completo.
