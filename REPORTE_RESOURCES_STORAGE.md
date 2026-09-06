# REPORTE_RESOURCES_STORAGE.md

## 1. Resumen

Se alineó el bucket `resources` en `supabase/storage.sql` con la convención de ownership por path y las políticas endurecidas que el usuario aplicará en Supabase. No se tocaron `projects` ni `publications`, que permanecen como pendientes.

También se verificó que `ResourceForm` cumpla con el flujo y validaciones requeridas sin necesidad de cambios adicionales.

---

## 2. Políticas documentadas

### Sección actualizada en `supabase/storage.sql`

```sql
-- =====================================================
-- RESOURCES BUCKET POLICIES
-- =====================================================
-- Path convention: {userId}/{resourceId}-{timestamp}.{ext}
-- SELECT público. INSERT: teacher/admin + foldername(name)[1] = auth.uid()
-- UPDATE/DELETE: dueño (foldername(name)[1] = auth.uid()) OR role = 'admin'

-- Anyone can view resources
CREATE POLICY "Public can view resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Teachers/admins can upload resources into their own folder
CREATE POLICY "Teachers can upload resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Owner or admin can update resources (folder [1] = auth.uid())
CREATE POLICY "Owners can update resources"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resources'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- Owner or admin can delete resources (folder [1] = auth.uid())
CREATE POLICY "Owners can delete resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources'
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

- `projects` — sigue con comentario `PENDIENTE` y políticas laxas.
- `publications` — sigue con comentario `PENDIENTE` y políticas laxas.

---

## 3. Ajustes de form

### Verificación de `ResourceForm` (`src/components/resources/ResourceForm.tsx`)

El formulario ya cumple con todos los requisitos sin necesidad de cambios:

| Requisito | Estado | Detalle |
|-----------|--------|---------|
| Create: insert → upload → update | ✅ | Flujo respetado en `onSubmit` |
| `type=link`: no exigir ni enviar file | ✅ | Muestra campo URL; no valida archivo |
| `type=document\|image\|video`: exigir file en create | ✅ | Lanza error si no hay archivo en create |
| Edit: file opcional | ✅ | Permite enviar sin nuevo archivo |
| Type del formulario manda | ✅ | Usa `data.type` directamente; no re-infiere |
| Errores en español | ✅ | Mensajes de validación en español |

### Validación en `uploadResourceFile` (`src/services/resources.service.ts`)

El método sigue infiriendo el tipo desde el MIME **solo** para aplicar límites de tamaño:

| Tipo inferido | Límite |
|---------------|--------|
| `image/*` | 5MB |
| `video/*` | 50MB |
| resto (`document`) | 20MB |

Esto no afecta el tipo guardado en la base de datos, que siempre viene del formulario.

---

## 4. Pendientes

- [ ] Aplicar las políticas de `storage.sql` del bucket `resources` en Supabase (el archivo ya está actualizado; falta ejecutar el SQL en la DB).
- [ ] Endurecer `projects` y `publications` cuando se implementen sus uploads y se defina la convención de paths en código.
- [ ] Limpieza de archivos huérfanos en storage al editar recursos (cambiar archivo sin borrar el anterior).
- [ ] Catálogo público de recursos (fuera de alcance de esta tarea).
- [ ] Instalar `typescript` en `node_modules` para poder ejecutar `tsc --noEmit` o `npm run build` localmente.
