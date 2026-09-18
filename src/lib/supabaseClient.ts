import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

const createSafeSessionStorage = (): Storage => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    }
  }

  try {
    return window.sessionStorage
  } catch {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: createSafeSessionStorage(),
    // Evita deadlock conocido del LockManager interno de supabase-js (navigator.locks)
    // en algunos navegadores, que bloquea auth.getSession() y las queries de datos.
    lock: async <R,>(_key: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
      return await fn()
    },
  },
})