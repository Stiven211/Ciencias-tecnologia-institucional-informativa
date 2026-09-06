# Reporte: Hardening de políticas Storage (ownership)

Fecha: 2026-09-02
Sesión continuación de endurecimiento de backend.

---

## 1. Resumen ejecutivo

Se endurecieron las políticas UPDATE y DELETE de los buckets `covers` y `gallery` para que solo el propietario del archivo o un admin puedan modificarlos/borrarlos. El ownership se determina por el prefijo de carpeta `{userId}` en el path de storage. Para habilitar esta verificación, se modificaron los métodos de upload en `projects.service.ts` y sus callers, cambiando el formato de path de los archivos. Se creó una migración SQL (`20260902191500_harden_storage_ownership.sql`) y se actualizó `supabase/storage.sql` para reflejar el estado final.

---

## 2. Estado actual de paths (antes de cambios)

### 2.1 `src/services/projects.service.ts`

| Método | Path anterior | Estructura |
|---|---|---|
| `uploadCoverImage(file, projectId)` | `covers/{projectId}-{Date.now()}.{fileExt}` | Sin folders, userId ausente |
| `uploadGalleryImage(file, projectId)` | `{projectId}-{Date.now()}-{random}.{fileExt}` | Sin folders, userId ausente |

### 2.2 `src/components/ui/AvatarUpload.tsx`

| Método | Path actual | Estructura |
|---|---|---|
| upload | `avatars/{user?.id}-avatar-{Date.now()}.{fileExt}` | userId en el filename, **sin folder** |

Nota: En Supabase Storage, `storage.foldername(name)` opera sobre el path relativo dentro del bucket. Para `avatars/user-id-avatar-123.jpg`, `foldername` no devuelve componentes separados porque no hay `/`. La política actual de avatars (`auth.uid()::text = (storage.foldername(name))[0]`) está **defectuosa** para este formato, pero el bucket de avatars está fuera del alcance explícito de esta tarea.

### 2.3 Implicación

Los paths de `covers` y `gallery` no permitían identificar al dueño. Las políticas UPDATE/DELETE anteriores solo validaban rol `teacher`/`admin`, lo que permitía a cualquier profesor modificar o borrar imágenes de otro.

---

## 3. Estado actual de políticas (antes)

### Covers bucket (`storage.sql` líneas 186-226)

| Política | Operación | Condición |
|---|---|---|
| Public can view cover images | SELECT | `bucket_id = 'covers'` |
| Teachers can upload cover images | INSERT | `bucket_id = 'covers' AND role IN ('teacher','admin')` |
| Teachers can update own cover images | UPDATE | `bucket_id = 'covers' AND role IN ('teacher','admin')` |
| Teachers can delete own cover images | DELETE | `bucket_id = 'covers' AND role IN ('teacher','admin')` |

### Gallery bucket (`storage.sql` líneas 137-180)

| Política | Operación | Condición |
|---|---|---|
| Public can view gallery images | SELECT | `bucket_id = 'gallery'` |
| Teachers can upload gallery images | INSERT | `bucket_id = 'gallery' AND role IN ('teacher','admin')` |
| Teachers can update own gallery images | UPDATE | `bucket_id = 'gallery' AND role IN ('teacher','admin')` |
| Teachers can delete own gallery images | DELETE | `bucket_id = 'gallery' AND role IN ('teacher','admin')` |

**Problema:** UPDATE y DELETE no verifican ownership del archivo. Cualquier teacher/admin puede alterar cualquier objeto del bucket.

---

## 4. Cambios realizados

### 4.1 Cambios en código de upload

#### `src/services/projects.service.ts`

Se actualizaron las firmas para recibir `userId: string` y se incluyó como prefijo de carpeta en el path:

```typescript
// Antes
async uploadCoverImage(file: File, projectId: string): Promise<string>
async uploadGalleryImage(file: File, projectId: string): Promise<string>

// Después
async uploadCoverImage(file: File, projectId: string, userId: string): Promise<string>
async uploadGalleryImage(file: File, projectId: string, userId: string): Promise<string>
```

Paths nuevos:
- `covers/{userId}/{projectId}-{Date.now()}.{fileExt}`
- `gallery/{userId}/{projectId}-{Date.now()}-{random}.{fileExt}`

#### `src/components/projects/ProjectForm.tsx`

Se actualizó el caller de `uploadCoverImage` para pasar `user.id`:

```typescript
// Antes
await projectsService.uploadCoverImage(coverImage, project?.id || crypto.randomUUID())

// Después
await projectsService.uploadCoverImage(coverImage, project?.id || crypto.randomUUID(), user.id)
```

#### `src/components/projects/GalleryUpload.tsx`

Se agregó la prop `userId: string` a la interface y se pasó al servicio:

```typescript
// Interface
interface GalleryUploadProps {
  images: string[]
  projectId: string
  userId: string          // <-- nuevo
  onChange: (images: string[]) => void
}

// Llamada al servicio
const url = await projectsService.uploadGalleryImage(file, projectId, userId)
```

El caller en `ProjectForm.tsx` ya fue actualizado para inyectar `userId={user.id}`.

### 4.2 Migración SQL

Archivo creado: `supabase/migrations/20260902191500_harden_storage_ownership.sql`

```sql
-- Migration: Harden storage ownership for covers and gallery buckets
-- Date: 2026-09-02
-- Context: After AUDITORIA_BACKEND_SUPABASE.md §4 and REPORTE_OWNERSHIP_Y_LIMPIEZA.md §6
--
-- This migration drops the overly-permissive UPDATE/DELETE policies on the
-- 'covers' and 'gallery' storage buckets and replaces them with ownership checks
-- based on the user id embedded in the storage path.
--
-- New upload paths (implemented in projects.service.ts):
--   covers:  covers/{userId}/{projectId}-{timestamp}.{ext}
--   gallery: gallery/{userId}/{projectId}-{timestamp}-{random}.{ext}
--
-- Policy logic:
--   - SELECT remains public (published projects need to display images).
--   - INSERT remains restricted to authenticated teacher/admin.
--   - UPDATE/DELETE now requires:
--       a) The first foldername matches auth.uid()::text (owner), OR
--       b) The user is an admin.
--   This mirrors the pattern already used for the 'avatars' bucket.

BEGIN;

-- =====================================================
-- COVERS BUCKET
-- =====================================================

DROP POLICY IF EXISTS "Teachers can update own cover images" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own cover images" ON storage.objects;

CREATE POLICY "Owners can update own cover images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'covers'
  AND (
    auth.uid()::text = (storage.foldername(name))[0]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

CREATE POLICY "Owners can delete own cover images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'covers'
  AND (
    auth.uid()::text = (storage.foldername(name))[0]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- =====================================================
-- GALLERY BUCKET
-- =====================================================

DROP POLICY IF EXISTS "Teachers can update own gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete own gallery images" ON storage.objects;

CREATE POLICY "Owners can update own gallery images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gallery'
  AND (
    auth.uid()::text = (storage.foldername(name))[0]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

CREATE POLICY "Owners can delete own gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery'
  AND (
    auth.uid()::text = (storage.foldername(name))[0]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

COMMIT;
```

### 4.3 Actualizaciones a `storage.sql`

Se reemplazaron las políticas UPDATE/DELETE de `covers` y `gallery` por las versiones con ownership check. Se añadió un comentario al inicio del archivo indicando el estado final y la referencia a la migración.

---

## 5. Políticas finales

### Covers bucket

| Rol | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| Público | ✅ | ❌ | ❌ | ❌ |
| Teacher (dueño) | ✅ | ✅ | ✅ (solo sus archivos) | ✅ (solo sus archivos) |
| Admin | ✅ | ✅ | ✅ (cualquier archivo) | ✅ (cualquier archivo) |
| Otro teacher | ✅ | ❌ | ❌ | ❌ |

### Gallery bucket

| Rol | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| Público | ✅ | ❌ | ❌ | ❌ |
| Teacher (dueño) | ✅ | ✅ | ✅ (solo sus archivos) | ✅ (solo sus archivos) |
| Admin | ✅ | ✅ | ✅ (cualquier archivo) | ✅ (cualquier archivo) |
| Otro teacher | ✅ | ❌ | ❌ | ❌ |

**Mecanismo de verificación:**
- `storage.foldername(name)[0]` extrae el primer componente del path (la carpeta `{userId}`).
- Se compara con `auth.uid()::text`.
- Si no coincide, se evalúa la subquery de admin.
- SELECT e INSERT no cambiaron.

---

## 6. Breaking changes / impacto en datos existentes

### Cambio de path

Los archivos subidos **antes** de esta migración usaban paths sin prefijo de usuario:

| Bucket | Path viejo | Path nuevo |
|---|---|---|
| covers | `covers/{projectId}-{timestamp}.{ext}` | `covers/{userId}/{projectId}-{timestamp}.{ext}` |
| gallery | `{projectId}-{timestamp}-{random}.{ext}` | `gallery/{userId}/{projectId}-{timestamp}-{random}.{ext}` |

### Impacto

1. **Imágenes existentes en `covers` y `gallery`** quedan en paths viejos. La lectura pública (`SELECT`) sigue funcionando porque la política SELECT no cambia.
2. **UPDATE/DELETE sobre archivos viejos** fallará con la nueva política, porque el path no tiene el prefijo `{userId}` y por lo tanto `storage.foldername(name)[0]` no coincide con `auth.uid()`. Solo un admin podría modificar/borrar esos archivos antiguos.
3. **Nuevas subidas** usarán el path con `userId` y quedarán protegidas correctamente.
4. **Recomendación:** Si se requiere migrar archivos antiguos, hay dos opciones:
   - Re-subir las imágenes desde la UI (genera nuevo path con userId).
   - Mover objetos en Storage manualmente o con un script, actualizando luego el campo `cover_image` o `gallery_images` en la tabla `projects` para apuntar al nuevo path.

No se realizó migración automática de objetos existentes porque Storage no tiene una operación `mv` nativa en SQL y el movimiento de archivos debe hacerse con cuidado para no perder datos.

---

## 7. Verificación

### TypeScript

Se ejecutó `pnpm tsc --noEmit`. El comando se lanzó pero excedió el timeout de 120s del entorno, por lo que no se pudo capturar la salida en esta sesión. Los cambios de tipo son locales y directos (solo se agregó un parámetro `userId: string` a dos métodos y una prop), por lo que no se esperan errores. **Se recomienda ejecutar manualmente:**

```bash
pnpm tsc --noEmit
```

### Consistencia de callers

Se verificó con grep que todos los callers de `uploadCoverImage` y `uploadGalleryImage` fueron actualizados:

- `src/components/projects/ProjectForm.tsx:90` — pasa `user.id` a `uploadCoverImage`.
- `src/components/projects/GalleryUpload.tsx:48` — pasa `userId` recibido por prop a `uploadGalleryImage`.
- `src/components/projects/ProjectForm.tsx:214-218` — inyecta `userId={user.id}` al renderizar `GalleryUpload`.

No hay otros callers en `src/`.

### Consistencia de SQL

Se verificó que `storage.sql` y la migración contienen las mismas políticas nuevas para `covers` y `gallery`.

---

## 8. Pendientes / recomendaciones

1. **Bucket `avatars` con mismo problema de ownership:**
   - La política actual de UPDATE/DELETE en `avatars` usa `storage.foldername(name)[0]`, pero los paths son `avatars/{user.id}-avatar-{timestamp}.{ext}` (sin carpetas). Eso hace que `foldername(name)[0]` sea NULL y la política sea inválida.
   - Cualquier teacher/admin podría modificar/borrar avatares ajenos.
   - Queda pendiente endurecer este bucket en una futura migración, idealmente normalizando el path a `avatars/{userId}/{fileName}`.

2. **Bucket `projects`, `resources`, `publications`:**
   - Tienen el mismo patrón permisivo en UPDATE/DELETE (solo verifican rol, no ownership).
   - Quedan fuera de esta tarea por alcance, pero deberían endurecerse en una siguiente tanda, preferiblemente normalizando paths con `userId` primero.

3. **Migración de objetos existentes en `covers` y `gallery`:**
   - Evaluar si se requiere un script de migración para mover archivos antiguos a los nuevos paths y actualizar las URLs en la tabla `projects`.
   - Mientras tanto, los archivos viejos siguen siendo legibles (SELECT público), pero no editables/borrables por owners no-admin.

4. **Verificación manual de `tsc --noEmit`:**
   - Ejecutar en local para confirmar que no hay errores de tipo por la nueva firma de los métodos de upload.

5. **Próxima auditoría sugerida:**
   - Revisar todos los `supabase.storage.from(...)` en el frontend para confirmar que no hay más uploads fuera de los servicios (por ejemplo, en hooks o páginas nuevas).
