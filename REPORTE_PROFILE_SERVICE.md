# Reporte: `profile.service` y sincronización de `storage.sql` con la DB real

## 1. Resumen

- `supabase/storage.sql` reescrito para reflejar las políticas **reales** ya
  aplicadas en Supabase para los buckets `avatars`, `covers` y `gallery`.
  - Todas las comprobaciones de ownership usan `storage.foldername(name)[1]`
    (PostgreSQL es 1-based). **No queda ningún `[0]` en el archivo.**
  - La nota de cabecera deja claro que la fuente de verdad es la DB y que
    `storage.sql` debe regenerarse para reflejar cualquier cambio futuro.
  - `projects`, `resources` y `publications` se documentan como
    **PENDIENTES** de alineación (fuera del alcance de esta tarea).
- Nuevo servicio `src/services/profile.service.ts` que encapsula todas las
  operaciones de `profiles` (lectura por id, update de campos editables,
  update de `avatar_url` y update de rol con guarda anti-auto-demotion).
- `ProfileEditor.tsx` y `AdminDashboardPage.tsx` ya no llaman a Supabase
  directo para `profiles`. `ProfessorProfilePage.tsx` también se migró a
  `profileService.getProfileById`.

## 2. Políticas documentadas en `storage.sql`

| Bucket     | SELECT | INSERT                                                              | UPDATE / DELETE                                                                       |
| ---------- | ------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| avatars    | público | `auth.uid()::text = foldername(name)[1]` (authenticated)             | `foldername(name)[1] = auth.uid()` **OR** `profiles.role = 'admin'`                  |
| covers     | público | `auth.uid()::text = foldername(name)[1]` AND `role IN (teacher, admin)` | `foldername(name)[1] = auth.uid()` **OR** `profiles.role = 'admin'`                  |
| gallery    | público | `auth.uid()::text = foldername(name)[1]` AND `role IN (teacher, admin)` | `foldername(name)[1] = auth.uid()` **OR** `profiles.role = 'admin'`                  |
| projects   | público | `role IN (teacher, admin)` (sin chequeo de folder, PENDIENTE)        | `role IN (teacher, admin)` (PENDIENTE)                                                |
| resources  | público | `role IN (teacher, admin)` (sin chequeo de folder, PENDIENTE)        | `role IN (teacher, admin)` (PENDIENTE)                                                |
| publications | público | `role IN (teacher, admin)` (sin chequeo de folder, PENDIENTE)     | `role IN (teacher, admin)` (PENDIENTE)                                                |

Convenciones de path:
- avatars: `{userId}/{userId}-avatar-{timestamp}.{ext}`
- covers:  `{userId}/{archivo}`
- gallery: `{userId}/{archivo}`

Se eliminó toda mención a `[0]` en el archivo.

## 3. API del `profile.service`

```ts
import { profileService } from '@/services/profile.service'
import type { UserRole } from '@/types'

profileService.getProfileById(id: string): Promise<Profile>
profileService.updateProfile(
    userId: string,
    data: {
      full_name?: string
      bio?: string | null
      specialization?: string | null
      avatar_url?: string | null
    }
): Promise<Profile>
profileService.updateAvatarUrl(userId: string, url: string | null): Promise<Profile>
profileService.updateProfessorRole(
    id: string,
    role: UserRole,
    context: { userId: string; isAdmin: boolean }
): Promise<Profile>
```

Reglas de negocio implementadas en el servicio:

- **Tipado estricto**: `ProfileUpdateInput` tipa solo los campos editables
  del perfil; `UserRole` se reusa del módulo `config/permissions`. **Sin
  `any`, sin `console.log`.**
- **Errores en español** con mensajes específicos por modo de fallo
  (id inválido, sin permisos, auto-demotion, sin cambios para guardar,
  error genérico de DB).
- **Guarda anti-auto-demotion**: si `id === context.userId && role !== 'admin'`
  se lanza `Error('Un administrador no puede quitarse su propio rol admin.')`.
- `updateProfessorRole` exige `context.isAdmin === true`; en caso contrario
  lanza error.
- `updateProfile` rechaza llamadas sin payload.

## 4. Callers actualizados

| Archivo                                         | Cambio                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/components/profile/ProfileEditor.tsx`      | Reemplazado `supabase.from('profiles').update(...)` por `profileService.updateProfile(...)`. Se eliminó la reconstrucción manual del objeto perfil: ahora se persiste la fila devuelta por Supabase vía `useAuthStore.getState().setProfile(updated)`. |
| `src/pages/dashboard/AdminDashboardPage.tsx`   | `updateProfessorRole` ahora delega en `profileService.updateProfessorRole` pasando `userId` y `isAdmin`. La UI muestra el error en un bloque `bg-red-50` con el mismo estilo de alerta del resto de la app (sin cambios visuales de layout). |
| `src/pages/public/ProfessorProfilePage.tsx`     | Lectura de `profiles` reemplazada por `profileService.getProfileById(id)`. La lectura de `projects` se mantiene (no estaba en alcance de esta tarea). |
| `src/components/ui/AvatarUpload.tsx`            | Sin cambios. El componente sigue subiendo a Storage; la persistencia del `avatar_url` se hace desde `ProfileEditor` vía `profileService`. |

Verificación con `grep -rn "supabase.from('profiles')"`:

```
src/services/auth.service.ts:53      <- único punto de INSERT (signup) — fuera de alcance
src/services/profile.service.ts       <- fuente canónica
REPORTE_OWNERSHIP_Y_LIMPIEZA.md:120  <- doc histórico, no es código
```

No queda ninguna llamada directa a `supabase.from('profiles')` en
`components/`, `pages/` ni `ProfileEditor`.

## 5. Verificación de tipos

- `npx tsc --noEmit` no se pudo ejecutar: `node_modules` no está instalado en
  este workspace. `package.json` declara `typescript ~6.0.2`. Acción
  recomendada para el usuario: `npm install` y luego `npm run build`
  (`tsc -b && vite build`).
- Revisión manual del tipado:
  - `ProfileUpdateInput` sólo declara campos opcionales conocidos.
  - `Profile` se importa de `src/types/index.ts` y se mantiene como tipo de
    retorno de los métodos del servicio.
  - En `ProfileEditor.tsx`, `setProfile(updated)` acepta un `Profile`
    completo, por lo que no hace falta el `...profile ?? {...}` previo.

## 6. Pendientes

1. **Buckets `projects`, `resources`, `publications`**: hoy sus políticas
   en la DB usan un patrón diferente (no validan folder). Aplicar la misma
   convención `[1] = auth.uid()` + admin override en una migración futura
   y regenerar este `storage.sql`.
2. **Migración inicial de avatares antiguos** (sin carpeta): quedó
   documentada en `REPORTE_AVATARS_OWNERSHIP.md`. Cualquier avatar previo
   a esta tarea sigue accesible vía URL pública pero no cumple la nueva
   política de UPDATE/DELETE; conviene migrar a `{userId}/` o pedir al
   usuario re-subir.
3. **`auth.service.ts`**: sigue haciendo `supabase.from('profiles').insert`
   en el flujo de signup. No está cubierto por esta tarea, pero podría
   moverse a `profileService.createProfile` en una iteración posterior.
4. **UI de error en `AdminDashboardPage`**: se añadió un banner rojo simple;
   podría reutilizar el `Alert` tipado de `components/ui` cuando exista.
5. **TS**: ejecutar `npm install` y `npm run build` para confirmar que no hay
   regresiones de tipos ni de Vite tras los cambios.