import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const MAX_INSTITUTIONAL_USERS = 7
const CHECK_TIMEOUT_MS = 5000

export function useInstitutionalUsers() {
  const [canRegister, setCanRegister] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const checkLimit = async () => {
      try {
        const { count, error } = await Promise.race([
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'teacher'),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), CHECK_TIMEOUT_MS),
          ),
        ])

        if (error) throw error
        if (!cancelled) setCanRegister((count ?? 0) < MAX_INSTITUTIONAL_USERS)
      } catch (err) {
        console.error('Error checking institutional users limit:', err)
        if (!cancelled) setCanRegister(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkLimit()
    return () => {
      cancelled = true
    }
  }, [])

  return { canRegister, loading }
}