# Reporte: Normalización de path de avatares a `avatars/{userId}/{filename}`

## 1. Resumen

Se actualizó el flujo de subida de avatares para que el path físico en el bucket
`avatars` siga el esquema con carpeta por usuario, alineado con la política
`storage.foldername(name)[1] = auth.uid()::text` ya aplicada en Supabase.

Esto resuelve:
- Fallos en INSERT por `(storage.foldername(name))[1]` (antes el archivo se
  guardaba plano, sin carpeta, y daría error de ownership).
- Inconsistencias en UPDATE/DELETE al pasar a `[1]`.
- Bug adicional detectado: el código previo construía el path con prefijo
  `avatars/` y luego llamaba a `.from('avatars').upload(...)`, lo que resultaba
  en un path físico con el bucket duplicado (`avatars/<uid>/<file>` dentro del
  bucket `avatars`).

## 2. Path anterior vs nuevo

| Concepto      | Antes                                                               | Ahora                                              |
| ------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| Path lógico   | `avatars/${userId}/${userId}-avatar-${ts}.${ext}` (con doble prefijo) | `${userId}/${userId}-avatar-${ts}.${ext}`          |
| Path en bucket| `avatars/<uid>/<uid>-avatar-<ts>.<ext>` (carpeta `avatars` literal) | `<uid>/<uid>-avatar-<ts>.<ext>`                    |
| URL pública   | `.../storage/v1/object/public/avatars/avatars/<uid>/<file>` (mal)   | `.../storage/v1/object/public/avatars/<uid>/<file>` |
| Índice policy  | `foldername(name)[0]`                                               | `foldername(name)[1]`                              |

## 3. Archivos modificados

- `src/components/ui/AvatarUpload.tsx`
  - `filePath` ahora es `${user.id}/${fileName}` (sin prefijo `avatars/`, ya
    que `.from('avatars')` ya sitúa el archivo dentro del bucket).
  - Comentarios añadidos documentando la convención de path y por qué cumple
    la política `[1] = auth.uid()::text`.
  - Validaciones de tipo (`image/*`) y tamaño (5 MB) intactas.
  - `userId` se sigue tomando de `useAuthStore().user.id`.

- `supabase/storage.sql`
  - Sección `AVATARS BUCKET POLICIES` actualizada:
    - INSERT: ahora exige `auth.uid()::text = (storage.foldername(name))[1]`.
    - UPDATE: ahora usa `[1]` en lugar de `[0]`.
    - DELETE: ahora usa `[1]` en lugar de `[0]`.
    - Comentario de cabecera documenta la convención
      `{userId}/{userId}-avatar-{timestamp}.{ext}`.
  - Las políticas de `covers` y `gallery` NO se modificaron: la fuente de
    verdad para esas sigue siendo la migración
    `20260902191500_harden_storage_ownership.sql` (que usa `[0]`).
    Se añadió una nota en cabecera para evitar confusión.

## 4. Breaking changes

- **Avatares antiguos guardados en plano** (`<uid>-avatar-<ts>.<ext>` en la
  raíz del bucket `avatars`) ya no cumplen la nueva política de INSERT/UPDATE/
  DELETE. Consecuencias:
  - Las URLs públicas guardadas en `profiles.avatar_url` que apunten a archivos
    planos seguirán resolviendo mientras el SELECT siga siendo público, pero
    cualquier intento de reemplazo o borrado con las nuevas políticas será
    denegado.
  - Mitigación recomendada (fuera del alcance de esta tarea):
    1. Migrar los archivos existentes a `<uid>/<uid>-avatar-<ts>.<ext>` con
       un job de Storage Admin API, o
    2. Reprocesar: pedir al usuario que vuelva a subir su avatar (el `upsert:
       true` sigue funcionando dentro del nuevo path).
- **No hay cambios visuales ni de UI.**
- **No se introdujeron dependencias nuevas.**

## 5. Verificación

- `tsc --noEmit`:
  - No se pudo ejecutar: `node_modules` no está instalado en este workspace
    (`Cannot find module .../node_modules/typescript/bin/tsc`). Las
    dependencias declaradas en `package.json` incluyen `typescript ~6.0.2`
    pero no se ha corrido `npm install` en este entorno.
  - Acción recomendada para el usuario: `npm install` y luego
    `npm run build` (que ejecuta `tsc -b && vite build`) para validar tipos
    en el build de CI.
- Revisión manual del archivo modificado (`AvatarUpload.tsx`):
  - El bloque `handleImageChange` mantiene el orden: validación → preview
    temporal → upload → URL pública → `onChange`.
  - `getPublicUrl(filePath)` recibe el mismo `${user.id}/${fileName}`, por lo
    que la URL pública apuntará al archivo correcto bajo el bucket.
  - No hay otras referencias a `storage.from('avatars')` en el repo
    (`grep -r "from('avatars')"` solo devuelve este archivo).

## 6. Notas operativas

- El usuario debe ejecutar en Supabase la sección actualizada de avatars de
  `supabase/storage.sql` (las políticas son idempotentes con `CREATE POLICY`
  sólo la primera vez; si ya existen las anteriores con `[0]`, habrá que
  hacer `DROP POLICY` primero o aplicar la migración de "harden" ya
  mencionada por el usuario).
- El path con doble `avatars/` previo generaba una URL pública tipo
  `.../public/avatars/avatars/<uid>/<file>`. Tras el cambio la URL será
  `.../public/avatars/<uid>/<file>`. Si la columna `profiles.avatar_url`
  todavía guarda la URL con doble `avatars`, deberá regenerarse en el
  siguiente upload (la nueva URL reemplazará a la anterior en `onChange`).