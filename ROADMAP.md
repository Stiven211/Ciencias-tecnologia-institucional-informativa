# ROADMAP — Próximas funciones

> Documento vivo. Nada de aquí está implementado todavía; cada item requiere diseño + migración + tests antes de tocar `main`.

## F1. Profesores pueden registrar a otros profesores (vía login)

**Decisión:** sin registro público abierto. Uno o varios docentes con habilitación registran a otros con correo + contraseña (+ nombre completo).

- Reutilizar permiso `manage_teachers` (hoy solo `admin`, sin UI) y otorgarlo a docentes designados, o crear permiso `register_teacher` si se quiere más granular.
- Nueva página `/dashboard/teachers/nuevo` con guard de permiso + formulario (email, password, nombre, rol inicial `teacher`).
- Flujo: usa el mismo `signUp` + crea fila en `profiles` con rol `teacher`; el límite de 7 usuarios (`MAX_INSTITUTIONAL_USERS`) se elimina para este flujo y el auto-registro público se cierra o queda con aprobación del admin.
- Requiere: política RLS en `profiles` que permita INSERT/UPDATE a poseedores del permiso (hoy solo el propio dueño/admin por defecto) + auditoría de quién registró a quién.
- Anti-abuso: solo usuarios autenticados con el permiso ven la opción; rate-limit de creaciones por hora.

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
