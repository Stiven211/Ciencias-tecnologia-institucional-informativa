const REST_FETCH_TIMEOUT_MS = 15000

interface SupabaseConfig {
  url: string
  anonKey: string
}

function getSupabaseConfig(): SupabaseConfig {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Configuración de Supabase no disponible (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
  }

  return { url: url.replace(/\/+$/, ''), anonKey }
}

type AuthMode = 'anon' | 'session'

function getAccessTokenFromStorage(): string | null {
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
  if (mode === 'session' && token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function restCount(
  table: string,
  filters: Record<string, string>,
  options: RestOptions = {}
): Promise<number> {
  const { url, anonKey } = getSupabaseConfig()
  const { mode = 'session', timeoutMs = REST_FETCH_TIMEOUT_MS } = options
  const token = mode === 'session' ? getAccessTokenFromStorage() : null

  if (mode === 'session' && !token) {
    console.warn('[supabaseRest] sin access_token en sessionStorage/localStorage')
    throw new Error('Sesión no disponible: no se encontró access_token en sessionStorage ni localStorage')
  }

  const queryString = buildQueryString({ ...filters, select: 'id' })
  const requestUrl = `${url}/rest/v1/${table}?${queryString}`

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
    throw new Error(`Error ${response.status} al contar ${table}: ${errorText}`)
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
  const { mode = 'session', timeoutMs = REST_FETCH_TIMEOUT_MS } = options
  const token = mode === 'session' ? getAccessTokenFromStorage() : null

  if (mode === 'session' && !token) {
    console.warn('[supabaseRest] sin access_token en sessionStorage/localStorage')
    throw new Error('Sesión no disponible: no se encontró access_token en sessionStorage ni localStorage')
  }

  const requestUrl = `${url}/rest/v1/${table}?${queryString}`

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
    throw new Error(`Error ${response.status} al consultar ${table}: ${errorText}`)
  }

  const data = (await response.json()) as T[]
  return data ?? []
}