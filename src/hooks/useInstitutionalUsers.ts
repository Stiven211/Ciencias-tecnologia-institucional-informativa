import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const MAX_INSTITUTIONAL_USERS = 7

export function useInstitutionalUsers() {
  const [canRegister, setCanRegister] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkLimit = async () => {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })

        if (error) throw error

        setCanRegister((count ?? 0) < MAX_INSTITUTIONAL_USERS)
      } catch (err) {
        console.error('Error checking institutional users limit:', err)
        setCanRegister(false)
      } finally {
        setLoading(false)
      }
    }

    checkLimit()
  }, [])

  return { canRegister, loading }
}