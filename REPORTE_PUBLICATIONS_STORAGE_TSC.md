# REPORTE_PUBLICATIONS_STORAGE_TSC.md

## 1. Resumen

Se alineó el bucket `publications` en `supabase/storage.sql` con la convención de ownership por path y las políticas endurecidas. También se ejecutó `npm install` y `npx tsc --noEmit` por primera vez en el proyecto, obteniendo un pase limpio sin errores de TypeScript.

---

## 2. Políticas publications en storage.sql

### Sección actualizada en `supabase/storage.sql`

```sql
-- =====================================================
-- PUBLICATIONS BUCKET POLICIES
-- =====================================================
-- Path convention: {userId}/{publicationId}-{timestamp}.{ext}
-- SELECT público. INSERT: teacher/admin + foldername(name)[1] = auth.uid()
-- UPDATE/DELETE: dueño (foldername(name)[1] = auth.uid()) OR role = 'admin'

-- Anyone can view publications
CREATE POLICY "Public can view publications"
ON storage.objects FOR SELECT
USING (bucket_id = 'publications');

-- Teachers/admins can upload publications into their own folder
CREATE POLICY "Teachers can upload publications"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'publications'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Owner or admin can update publications (folder [1] = auth.uid())
CREATE POLICY "Owners can update publications"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'publications'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- Owner or admin can delete publications (folder [1] = auth.uid())
CREATE POLICY "Owners can delete publications"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'publications'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);
```

### Cambios clave

| Antes | Después |
|-------|---------|
| Comentario `PENDIENTE` | Comentario con convención de path real |
| INSERT sin ownership check | `auth.uid()::text = (storage.foldername(name))[1]` + `teacher/admin` |
| UPDATE/DELETE sin ownership check | `foldername(name)[1] = auth.uid()` **OR** `admin` |
| Políticas con `EXISTS (teacher, admin)` en UPDATE/DELETE | Separadas: dueño por path **o** admin |

### Buckets pendientes (sin cambios)

- `projects` — sigue sin políticas endurecidas y sin uploads en código.
- `resources` — ya alineado en tarea anterior.

---

## 3. Resultado de npm install

**Estado: OK**

`npm install` completó exitosamente en la raíz del proyecto (`C:\Users\sedgu\Documents\GitHub\Ciencias-tecnologia-institucional-informativa`). Se instalaron las dependencias necesarias, incluyendo `typescript`, que permitió ejecutar el typecheck por primera vez.

No hubo conflictos de lockfiles ni errores durante la instalación.

---

## 4. Resultado de tsc --noEmit

**Estado: OK — 0 errores**

```
npx tsc --noEmit
```

El comando terminó sin errores. No fue necesario corregir tipos, imports ni props.

---

## 5. Pendientes

- [ ] Aplicar las políticas de `storage.sql` del bucket `publications` en Supabase (el archivo ya está actualizado; falta ejecutar el SQL en la DB).
- [ ] Endurecer `projects` cuando se implementen sus uploads y se defina la convención de paths en código.
- [ ] Limpieza de archivos huérfanos en storage al editar publicaciones (cambiar portada sin borrar la anterior).
- [ ] Catálogo público de publicaciones (fuera de alcance de esta tarea).
- [ ] Considerar migrar `tsc` a un script de CI o pre-commit para evitar regresiones de tipado.
