# ROADMAP — Próximas funciones

> Documento vivo. Cada item requiere diseño + migración + tests antes de tocar `main`.

## Estado 2026-10-10

**Hecho:**
- F2 — límite de usuarios configurable (`VITE_MAX_INSTITUTIONAL_USERS`, `0` = ilimitado) + flag `VITE_PUBLIC_REGISTRATION` (cerrado por defecto).
- F3 — `profiles.teaching_area` (lista cerrada de 6 áreas, alineada con el Home) + select en el editor + badge en el perfil público.
- F4 — `profiles.academic_level` (6 niveles) + select en el editor + badge en el perfil público.
- F1 — registro de profesores por admin o delegado:
  - `profiles.can_invite_teachers` (flag por perfil, no permiso de rol)
  - Edge Function `create-teacher` desplegada (service_role, nunca en el cliente)
  - `audit_log` con quién invite a quién
  - `/dashboard/teachers/new` con gate en UI y en servidor
  - Un delegado **siempre** crea `teacher`; el pedido de `admin` se degrada en el servidor
- Cierre de la fuga de correos: `public_profiles` expone la superficie pública, `profiles` quedó privada (dueño + admins).

**Pendiente:**
- Panel de gestión de docentes: delegar `can_invite_teachers` desde la UI y revocar cuentas. Hoy el flag se cambia por SQL o REST.
- Backfill: los 7 perfiles tienen `teaching_area` y `academic_level` en NULL hasta que cada docente los diligencie.

## F1. Profesores pueden registrar a otros profesores (vía login) — HECHO

**Decisión:** sin registro público abierto. Un admin — o un profesor con
`can_invite_teachers = true` — registra a otro docente con correo + contraseña.

- `can_invite_teachers` es un flag por perfil, **no** un permiso de rol, para que
  "puedo invitar" y "soy admin" queden separados. Un delegado puede invitar pero
  el servidor le impone `role = 'teacher'`; nadie crea admins desde la UI.
- La creación va por la Edge Function `create-teacher` porque
  `disable_signup = true` cierra `/auth/v1/signup` y `auth.admin.createUser()`
  necesita la secret key, que no puede salir del servidor.
- Tope de 10 invitaciones por actor por hora + bitácora en `audit_log`.

**Cómo probarlo:** activar el flag por REST con el JWT del admin y entrar como
ese profesor. El propio admin se puede delegar el flag a sí mismo.

## F2. Registro sin límite fijo de 7

- Quitar `MAX_INSTITUTIONAL_USERS = 7` de `auth.service.ts` o volverlo configurable por variable de entorno (`VITE_MAX_INSTITUTIONAL_USERS`, `0` = ilimitado).
- Si algún día se abre registro público: captcha + confirmación por email + aprobación admin (ver F1) antes de activar la cuenta.

## F3. Campo "área que dicta" (lista fija, sin texto libre)

- Nueva columna `profiles.teaching_area` (migración SQL) con CHECK a lista fija:
  `Biología, Química, Física, Informática, Tecnología, Educación Ambiental, Robótica`
  (mismos valores del Home para que filtren el catálogo).
- UI: select en editor de perfil + mostrar en perfil público + filtro por área en catálogo/profesores.
- Tipos: `Profile.teaching_area: string | null`; backfill `null` para filas existentes.

## F4. Columna nueva `academic_level` (no tocar `specialization`)

- Nueva columna `profiles.academic_level` (migración SQL), se conserva `specialization` intacta.
- Enum sugerido: `Normalista, Profesional, Especialización, Maestría, Doctorado, Postdoctorado`.
- UI: select en perfil + badge en perfil público y tarjetas.

## Extras propuestos (sin priorizar)

1. **Moderación con aprobación:** publicar un proyecto queda en `draft` hasta que un admin lo aprueba (resuelve para siempre la "basura visible" en portada).
2. **`requireOwnership` en publications, resources y activities** (hoy solo projects lo tiene) + endurecer RLS de Storage por propietario (`covers/`, `gallery/`).
3. **Auditoría de cambios:** tabla `audit_log` (quién/qué/cuándo) para creaciones, cambios de rol y publicaciones.
4. **SEO completo:** `description`, Open Graph/Twitter, `canonical`, `theme-color`, sitemap.
5. **Migración reglas hooks:** resolver `react-hooks/set-state-in-effect` y `preserve-manual-memoization` sin romper el fix F5 (requiere tests F5 verdes antes/después).
6. **Buscador global** (proyectos + publicaciones + docentes) y **exportes** (CSV/Excel de listados).
7. **Code-splitting:** el bundle supera 1.2 MB; lazy-load de rutas del dashboard.
8. **Tipos generados desde Supabase** (`supabase gen types`) para evitar drift con el schema.
9. **Trigger `handle_new_user`:** crear la fila de `profiles` automáticamente al registrarse, eliminando el doble `signUp + signIn` actual.
10. **Notificaciones** (nuevo proyecto publicado, nuevo registro pendiente de aprobación).

## Orden sugerido

F3 + F4 (migraciones chicas) → F2 (config) → F1 (registro por profes + RLS) → extras 1–2 (moderación + ownership) → resto.

---

## Incidente de seguridad 2026-10-10 (resuelto)

Antes de empezar F1 se encontró y se corrigió una inyección de contenido en producción.

**El vector, verificado extremo a extremo antes de tocar nada:**

1. `POST /auth/v1/signup` con la llave `anon` — que va incrustada en el bundle del navegador, es pública por diseño — devolvía sesión inmediata porque el proyecto tenía `mailer_autoconfirm = true`.
2. El trigger `on_auth_user_created` (`handle_new_user`) asigna `role = 'teacher'` de forma fija, así que esa cuenta anónima era profesora.
3. Esa cuenta podía insertar un proyecto con `status = 'published'`, que se renderiza en el sitio público del colegio.

El límite de 7 usuarios de `authService.signUp` nunca mitigar nada: es código de frontend y ni `/auth/v1/signup` ni `/rest/v1` lo imponen.

**Lo que ya estaba bien** (defensa en profundidad que sí funcionó): el trigger `prevent_profile_role_escalation` y el `WITH CHECK` de la policy de UPDATE impiden que un usuario cambie su propio rol. No hubo escalamiento a `admin`; el daño era contenido basura publicado por terceros.

**El arreglo, en dos mitades:**

| Mitad | Dónde | Estado |
|---|---|---|
| `disable_signup = true` (bloquea `/auth/v1/signup`) | Config de auth del proyecto | aplicada |
| Policy de INSERT en `profiles` limitada a `service_role` | `20261010103000_lock_down_public_signup.sql` | aplicada |
| `VITE_PUBLIC_REGISTRATION` cerrado por defecto | `src/config/institutional.ts` | aplicada |

`auth.admin.createUser()` no se ve afectado por `disable_signup`, así que F1 sigue siendo viable.

**Pendiente de este incidente:**
- Rotar la llave `anon` no es necesario (es pública por diseño, no es un secreto), pero sí conviene revisar si hay que purgarla.
- Los 34 huérfanos de Storage que dejaron las pruebas de QA (`covers/covers/…`, `covers/gallery/…`, `covers/new-*.jpg`, `avatars/avatars/…`) no se pudieron borrar por SQL: Supabase lo prohíbe (`Direct deletion from storage tables is not allowed`). Hay que borrarlos desde el dashboard o con la Storage API usando la secret key.
- Considerar `security_captcha_enabled` si algún día se reabre el registro.

---

## Incidente 2 — Fuga de correos de los profesores (resuelto)

`profiles` tenía la policy `Public can view profiles` TO public USING (true), así
que `GET /rest/v1/profiles` devolvía **todas las columnas de todos los perfiles**
— incluido `email` — a cualquier visitante anónimo. Son datos de contacto
personales de los docentes.

La tabla se partió en dos superficies:

| Superficie | Quién la lee | Qué expone |
|---|---|---|
| `public_profiles` (vista) | cualquiera | id, nombre, avatar, bio, especialización, áreas, nivel |
| `profiles` (tabla) | el dueño y los admins | todo, incluido `email` |

Los 26 embeds `professor:profiles(...)` del frontend pasaron a
`professor:public_profiles(...)`; PostgREST sí resuelve el embed de la vista a
través de la FK `projects.professor_id`.

---

## Incidente 3 — Recursión infinita en las policies de `profiles` (resuelto)

Al añadir la policy de SELECT restricted apareció
`42P17: infinite recursion detected in policy for relation "profiles"`, que
devolvía **HTTP 500 en toda lectura de perfiles de un usuario autenticado**.

La causa: la policy hacía `EXISTS (SELECT 1 FROM public.profiles ...)` sobre su
propia tabla. Postgres lo prohíbe. La policy de `UPDATE` que ya existía tenía el
mismo defecto — o sea que **cambiar el rol de un usuario nunca funcionó**, lo que
explica por qué `manage_teachers` nunca tuvo UI.

El arreglo fue mover la comprobación a una función `SECURITY DEFINER`:

```sql
create function public.is_admin() returns boolean
language sql stable security definer set search_path to public
as $$ select exists (
  select 1 from public.profiles where id = auth.uid() and role = 'admin'
) $$;
```

No toma argumentos y lee `auth.uid()` del request, así que solo puede devolver el
estado de admin **del propio llamador**. Aun así se revoca el `EXECUTE` por
defecto a `PUBLIC` y se otorga solo a `authenticated`.
