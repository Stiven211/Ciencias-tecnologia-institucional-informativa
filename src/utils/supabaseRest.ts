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

function getAccessTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (keys.length === 0) return null

    const latestKey = keys.sort().pop()
    if (!latestKey) return null

    const raw = localStorage.getItem(latestKey)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return parsed?.access_token ?? null
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

export async function restCount(
  table: string,
  filters: Record<string, string>,
  timeoutMs = REST_FETCH_TIMEOUT_MS
): Promise<number> {
  const { url, anonKey } = getSupabaseConfig()
  const token = getAccessTokenFromStorage()

  if (!token) {
    throw new Error('Sesión no disponible: no se encontró access_token en localStorage')
  }

  const queryString = buildQueryString({ ...filters, select: 'id' })
  const requestUrl = `${url}/rest/v1/${table}?${queryString}`

  const response = await fetchWithTimeout(
    requestUrl,
    {
      method: 'HEAD',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
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
  timeoutMs = REST_FETCH_TIMEOUT_MS
): Promise<T[]> {
  const { url, anonKey } = getSupabaseConfig()
  const token = getAccessTokenFromStorage()

  if (!token) {
    throw new Error('Sesión no disponible: no se encontró access_token en localStorage')
  }

  const requestUrl = `${url}/rest/v1/${table}?${queryString}`

  const response = await fetchWithTimeout(
    requestUrl,
    {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
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