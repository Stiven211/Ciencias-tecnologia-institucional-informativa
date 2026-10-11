// Edge Function: create-teacher
// Roadmap F1 — registro de profesores.
//
// Por qué una Edge Function y no el frontend: el proyecto tiene
// `disable_signup = true` en la config de auth, asi que el navegador ya no
// puede crear usuarios. La unica via es `auth.admin.createUser()`, que exige
// la secret key — y esa key jamas puede viajar al bundle del navegador.
//
// Reglas de autorizacion (ver supabase/migrations/20261010153000_*):
//   - admin                       -> puede invitar con rol teacher o admin
//   - can_invite_teachers = true  -> puede invitar, SIEMPRE con rol teacher
//   - cualquiera mas              -> 403
//
// La distincion importa: "puedo invitar" y "soy admin" son capacidades
// separadas a proposito. Si un profesor pudiera crear cuentas indistintamente,
// un error de rol en el flujo seria una escalacion directa a admin.
//
// Idempotencia: si el email ya existe, responde 409 sin crear nada.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Tope de invitaciones por actor en una hora. Es una barrera de abuse
// superficial, no un control de seguridad: el permiso es lo que protege.
const MAX_INVITES_PER_HOUR = 10

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

interface Caller {
  id: string
  role: string
  canInvite: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function resolveCaller(req: Request): Promise<Caller | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.error('resolveCaller: sin cabecera Authorization')
    return null
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    console.error('resolveCaller: cabecera Authorization sin token')
    return null
  }

  // Cliente con la anon key + el JWT del que llama: respeta RLS.
  const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })

  // El token hay que pasarlo explícitamente: con persistSession false no hay
  // sesión local de la que getUser() pueda leer.
  const { data: userData, error: userError } = await asCaller.auth.getUser(token)
  if (userError || !userData.user) {
    console.error('resolveCaller: getUser fallo', {
      message: userError?.message,
      status: userError?.status,
      name: userError?.name,
    })
    return null
  }

  const { data: profile, error: profileError } = await asCaller
    .from('profiles')
    .select('role, can_invite_teachers')
    .eq('id', userData.user.id)
    .single()

  if (profileError || !profile) {
    console.error('resolveCaller: lectura de profile fallo', {
      userId: userData.user.id,
      message: profileError?.message,
      code: profileError?.code,
    })
    return null
  }

  console.log('resolveCaller: ok', { userId: userData.user.id, role: profile.role })

  return {
    id: userData.user.id,
    role: profile.role,
    canInvite: profile.can_invite_teachers === true,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  try {
    // ---- 1. Identidad ------------------------------------------------
    const caller = await resolveCaller(req)
    if (!caller) {
      return json({ error: 'Sesión inválida o expirada.' }, 401)
    }

    // ---- 2. Autorización ---------------------------------------------
    const isAdmin = caller.role === 'admin'
    if (!isAdmin && !caller.canInvite) {
      return json(
        { error: 'No tienes permiso para registrar profesores.' },
        403,
      )
    }

    // ---- 3. Validación de entrada -----------------------------------
    let payload: { email?: string; password?: string; fullName?: string; role?: string }
    try {
      payload = await req.json()
    } catch {
      return json({ error: 'Cuerpo de la petición inválido.' }, 400)
    }

    const email = (payload.email ?? '').trim().toLowerCase()
    const password = payload.password ?? ''
    const fullName = (payload.fullName ?? '').trim()
    const requestedRole = payload.role ?? 'teacher'

    if (!EMAIL_RE.test(email)) {
      return json({ error: 'El correo no tiene un formato válido.' }, 400)
    }
    if (fullName.length < 2) {
      return json({ error: 'El nombre debe tener al menos 2 caracteres.' }, 400)
    }
    if (password.length < 8) {
      return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400)
    }

    // Un coordinador NUNCA puede crear un admin, aunque lo pida el cliente.
    const targetRole = isAdmin && requestedRole === 'admin' ? 'admin' : 'teacher'

    // ---- 4. Rate limit por actor ------------------------------------
    const { count: recentInvites } = await admin
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('actor_id', caller.id)
      .eq('action', 'teacher_created')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    if ((recentInvites ?? 0) >= MAX_INVITES_PER_HOUR) {
      return json(
        { error: 'Alcanzaste el límite de invitaciones por hora. Intenta más tarde.' },
        429,
      )
    }

    // ---- 5. Crear el usuario ----------------------------------------
    // email_confirm: true porque el proyecto tiene mailer_autoconfirm y no
    // hay flujo de verificación de correo configurado; exigir confirmación
    // dejaría al profesor recién creado sin poder entrar.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createError) {
      const alreadyExists =
        createError.status === 422 || createError.message.toLowerCase().includes('already')
      if (alreadyExists) {
        return json({ error: 'Ya existe una cuenta con ese correo.' }, 409)
      }
      return json({ error: 'No se pudo crear la cuenta.' }, 500)
    }

    // ---- 6. Ajustar el perfil ---------------------------------------
    // handle_new_user() ya inserts una fila con role 'teacher'; si el
    // administrador pidió 'admin', la subimos. Además rellenamos el nombre
    // real, que el trigger deja como prefijo del correo.
    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: targetRole, full_name: fullName, email })
      .eq('id', created.user.id)

    if (profileError) {
      // No dejamos un usuario de auth huérfano: si el perfil falla, lo
      // eliminamos para que el reintento no choque con el 409.
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: 'No se pudo crear el perfil del profesor.' }, 500)
    }

    // ---- 7. Auditoría -----------------------------------------------
    await admin.from('audit_log').insert({
      action: 'teacher_created',
      actor_id: caller.id,
      target_id: created.user.id,
      target_email: email,
      target_role: targetRole,
      metadata: { invited_by_role: caller.role, used_delegation: !isAdmin },
    })

    return json(
      {
        id: created.user.id,
        email,
        fullName,
        role: targetRole,
        delegated: !isAdmin,
      },
      201,
    )
  } catch (err) {
    console.error('create-teacher unexpected error', err)
    return json({ error: 'Error interno del servidor.' }, 500)
  }
})
