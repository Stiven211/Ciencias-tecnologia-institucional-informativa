const REST_FETCH_TIMEOUT_MS = 15000

interface SupabaseConfig {
  url: string
  anonKey: string
}

function getSupabaseConfig(): SupabaseConfig {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Configuracion de Supabase no disponible (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
  }

  return { url: url.replace(/\/+$/, ''), anonKey }
}

type AuthMode = 'anon' | 'session' | 'auto'

export function getAccessTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null

  const readFrom = (store: Storage): string | null => {
    try {
      const keys = Object.keys(store).filter(
        (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
      )
      if (keys.length === 0) return null

      const latestKey = keys.sort().pop()
      if (!latestKey) return null

      const raw = store.getItem(latestKey)
      if (!raw) return null

      const parsed = JSON.parse(raw)
      const token =
        parsed?.access_token ??
        parsed?.currentSession?.access_token ??
        null

      return typeof token === 'string' && token.length > 0 ? token : null
    } catch {
      return null
    }
  }

  const fromSession = readFrom(window.sessionStorage)
  if (fromSession) return fromSession

  try {
    return readFrom(window.localStorage)
  } catch {
    return null
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timer)
  }
}

function buildQueryString(filters: Record<string, string>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    params.append(key, value)
  }
  return params.toString()
}

interface RestOptions {
  mode?: AuthMode
  timeoutMs?: number
}

function buildHeaders(anonKey: string, mode: AuthMode, token: string | null): Record<string, string> {
  const headers: Record<string, string> = { apikey: anonKey }
  if (mode !== 'anon' && token) {
    headers.Authorization = 'Bearer ' + token
  }
  return headers
}

function getHeaders(anonKey: string, mode: AuthMode, token: string | null, prefer = 'return=representation'): Record<string, string> {
  return {
    ...buildHeaders(anonKey, mode, token),
    'Content-Type': 'application/json',
    Prefer: prefer,
    Accept: 'application/json',
  }
}

function resolveToken(mode: AuthMode): string | null {
  if (mode === 'anon') return null

  const token = getAccessTokenFromStorage()

  if (!token && mode === 'session') {
    throw new Error('Sesion no disponible: no se encontro access_token en sessionStorage ni localStorage')
  }

  return token
}

function buildMatchParams(matchParams: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(matchParams)) {
    params.append(key, `eq.${value}`)
  }
  return params
}

export async function restCount(
  table: string,
  filters: Record<string, string>,
  options: RestOptions = {}
): Promise<number> {
  const { url, anonKey } = getSupabaseConfig()
  const { mode = 'auto', timeoutMs = REST_FETCH_TIMEOUT_MS } = options
  const token = resolveToken(mode)

  const queryString = buildQueryString({ ...filters, select: 'id' })
  const requestUrl = url + '/rest/v1/' + table + '?' + queryString

  const response = await fetchWithTimeout(
    requestUrl,
    {
      method: 'HEAD',
      headers: {
        ...buildHeaders(anonKey, mode, token),
        Prefer: 'count=exact',
      },
    },
    timeoutMs
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error('Error ' + response.status + ' al contar ' + table + ': ' + errorText)
  }

  const contentRange = response.headers.get('content-range')
  if (contentRange) {
    const match = contentRange.match(/\/(\d+)$/)
    if (match) return parseInt(match[1], 10)
  }

  const preferCount = response.headers.get('prefer') || response.headers.get('x-total-count')
  if (preferCount) {
    const parsed = parseInt(preferCount, 10)
    if (!isNaN(parsed)) return parsed
  }

  return 0
}

export async function restSelect<T>(
  table: string,
  queryString: string,
  options: RestOptions = {}
): Promise<T[]> {
  const { url, anonKey } = getSupabaseConfig()
  const { mode = 'auto', timeoutMs = REST_FETCH_TIMEOUT_MS } = options
  const token = resolveToken(mode)

  const requestUrl = url + '/rest/v1/' + table + '?' + queryString

  const response = await fetchWithTimeout(
    requestUrl,
    {
      method: 'GET',
      headers: {
        ...buildHeaders(anonKey, mode, token),
        Accept: 'application/json',
      },
    },
    timeoutMs
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error('Error ' + response.status + ' al consultar ' + table + ': ' + errorText)
  }

  const data = (await response.json()) as T[]
  return data ?? []
}

export async function restInsert<T>(
  table: string,
  rows: Record<string, unknown>[],
  options: RestOptions = {}
): Promise<T[]> {
  const { url, anonKey } = getSupabaseConfig()
  const { mode = 'session', timeoutMs = REST_FETCH_TIMEOUT_MS } = options
  const token = resolveToken(mode)

  const requestUrl = url + '/rest/v1/' + table
  
  
  

  const response = await fetchWithTimeout(
    requestUrl,
    {
      method: 'POST',
      headers: getHeaders(anonKey, mode, token),
      body: JSON.stringify(rows),
    },
    timeoutMs
  )

  

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error('Error ' + response.status + ' al insertar en ' + table + ': ' + errorText)
  }

  const data = (await response.json()) as T[]
  
  return data
}

export async function restUpdate<T>(
  table: string,
  updates: Record<string, unknown>,
  matchParams: Record<string, string>,
  options: RestOptions = {}
): Promise<T[]> {
  const { url, anonKey } = getSupabaseConfig()
  const { mode = 'session', timeoutMs = REST_FETCH_TIMEOUT_MS } = options
  const token = resolveToken(mode)

  const params = buildMatchParams(matchParams)
  const requestUrl = url + '/rest/v1/' + table + '?' + params.toString()

  const response = await fetchWithTimeout(
    requestUrl,
    {
      method: 'PATCH',
      headers: getHeaders(anonKey, mode, token),
      body: JSON.stringify(updates),
    },
    timeoutMs
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error('Error ' + response.status + ' al actualizar ' + table + ': ' + errorText)
  }

  if (response.status === 204) return []

  const data = (await response.json()) as T[]
  return data
}

export async function restDelete(
  table: string,
  matchParams: Record<string, string>,
  options: RestOptions = {}
): Promise<void> {
  const { url, anonKey } = getSupabaseConfig()
  const { mode = 'session', timeoutMs = REST_FETCH_TIMEOUT_MS } = options
  const token = resolveToken(mode)

  const params = buildMatchParams(matchParams)
  const requestUrl = url + '/rest/v1/' + table + '?' + params.toString()

  const response = await fetchWithTimeout(
    requestUrl,
    {
      method: 'DELETE',
      headers: buildHeaders(anonKey, mode, token),
    },
    timeoutMs
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error('Error ' + response.status + ' al eliminar de ' + table + ': ' + errorText)
  }
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  token_type: string
  user: {
    id: string
    email: string
  }
}

export async function restAuthLogin(email: string, password: string): Promise<AuthSession> {
  const { url, anonKey } = getSupabaseConfig()
  const tokenUrl = url + '/auth/v1/token?grant_type=password'

  const response = await fetchWithTimeout(
    tokenUrl,
    {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
    15000
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    let message = 'Error ' + response.status + ' al iniciar sesion'
    try {
      const parsed = JSON.parse(errorText)
      if (parsed?.error_description) message = parsed.error_description
      else if (parsed?.error) message = parsed.error
    } catch {
      if (errorText) message = message + ': ' + errorText
    }
    throw new Error(message)
  }

  const session = (await response.json()) as AuthSession

  if (typeof window !== 'undefined' && window.sessionStorage) {
    const projectRef = url.replace(/^https?:\/\//, '').replace(/\.supabase\.co$/, '').replace(/[^a-zA-Z0-9-]/g, '')
    const storageKey = 'sb-' + projectRef + '-auth-token'
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type,
        user: session.user,
      }))
    } catch {
      // ignore storage errors
    }
  }

  return session
}

export async function restAuthSignUp(email: string, password: string): Promise<AuthSession> {
  const { url, anonKey } = getSupabaseConfig()
  const signupUrl = url + '/auth/v1/signup'

  const response = await fetchWithTimeout(
    signupUrl,
    {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
    15000
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    let message = 'Error ' + response.status + ' al registrarse'
    try {
      const parsed = JSON.parse(errorText)
      if (parsed?.error_description) message = parsed.error_description
      else if (parsed?.error) message = parsed.error
    } catch {
      if (errorText) message = message + ': ' + errorText
    }
    throw new Error(message)
  }

  const data = (await response.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    expires_at?: number
    token_type?: string
    user?: { id: string; email: string }
  }

  if (!data.user?.id) {
    throw new Error('No se pudo crear el usuario.')
  }

  if (data.access_token && data.refresh_token) {
    const session: AuthSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in ?? 3600,
      expires_at: data.expires_at ?? Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
      token_type: data.token_type ?? 'bearer',
      user: { id: data.user.id, email: data.user.email ?? email },
    }

    if (typeof window !== 'undefined' && window.sessionStorage) {
      const projectRef = url.replace(/^https?:\/\//, '').replace(/\.supabase\.co$/, '').replace(/[^a-zA-Z0-9-]/g, '')
      const storageKey = 'sb-' + projectRef + '-auth-token'
      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          expires_at: session.expires_at,
          token_type: session.token_type,
          user: session.user,
        }))
      } catch {
        // ignore storage errors
      }
    }

    return session
  }

  const session = await restAuthLogin(email, password)
  return session
}

export async function restAuthResetPassword(email: string, redirectTo: string): Promise<void> {
  const { url, anonKey } = getSupabaseConfig()
  const resetUrl = url + '/auth/v1/recover'

  const response = await fetchWithTimeout(
    resetUrl,
    {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, redirect_to: redirectTo }),
    },
    15000
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error('Error ' + response.status + ' al solicitar recuperacion de contrasena: ' + errorText)
  }
}

export async function restAuthUpdatePassword(newPassword: string): Promise<void> {
  const { url, anonKey } = getSupabaseConfig()
  const token = getAccessTokenFromStorage()

  if (!token) {
    throw new Error('Sesion no disponible: no se encontro access_token en sessionStorage ni localStorage')
  }

  const response = await fetchWithTimeout(
    url + '/auth/v1/user',
    {
      method: 'PUT',
      headers: {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    },
    15000
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error('Error al actualizar la contrasena: ' + errorText)
  }
}

export async function restAuthLogout(): Promise<void> {
  const { url, anonKey } = getSupabaseConfig()
  const token = getAccessTokenFromStorage()

  const response = await fetchWithTimeout(
    url + '/auth/v1/logout',
    {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + (token ?? anonKey),
        'Content-Type': 'application/json',
      },
    },
    15000
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error('Error al cerrar sesion: ' + errorText)
  }

  if (typeof window !== 'undefined') {
    try {
      const keys = Object.keys(window.sessionStorage).filter(
        (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
      )
      keys.forEach((k) => window.sessionStorage.removeItem(k))
    } catch {
      // ignore storage errors
    }
  }
}

