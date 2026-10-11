import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  MAX_INSTITUTIONAL_USERS,
  IS_REGISTRATION_LIMITED,
  PUBLIC_REGISTRATION_ENABLED,
} from '../config/institutional'

const CHECK_TIMEOUT_MS = 5000

/**
 * When the config already settles the answer there is nothing to fetch, so the
 * hook starts in its final state and never needs an effect to reach it.
 */
const NEEDS_REMOTE_CHECK = PUBLIC_REGISTRATION_ENABLED && IS_REGISTRATION_LIMITED

export function useInstitutionalUsers() {
  const [canRegister, setCanRegister] = useState<boolean | null>(
    NEEDS_REMOTE_CHECK ? null : PUBLIC_REGISTRATION_ENABLED
  )
  const [loading, setLoading] = useState(NEEDS_REMOTE_CHECK)

  useEffect(() => {
    if (!NEEDS_REMOTE_CHECK) return

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
