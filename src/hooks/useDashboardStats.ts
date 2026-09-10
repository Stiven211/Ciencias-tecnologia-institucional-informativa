import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../store/authStore'
import { withTimeout, DATA_FETCH_TIMEOUT_MS } from '../utils/fetchTimeout'

interface DashboardStats {
  projects: number
  resources: number
  collaborators: number
}

export const useDashboardStats = () => {
  const { user, initialized } = useAuthStore()
  const requestIdRef = useRef(0)

  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    resources: 0,
    collaborators: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!initialized) {
      return
    }

    if (!user?.id) {
      setLoading(false)
      return
    }

    const requestId = ++requestIdRef.current

    try {
      setLoading(true)
      setError(null)

      const [
        projectsCount,
        resourcesCount,
        profilesCount
      ] = await Promise.all([
        withTimeout(
          async () => {
            return await supabase
              .from('projects')
              .select('id', { count: 'exact', head: true })
              .eq('professor_id', user.id)
          },
          DATA_FETCH_TIMEOUT_MS
        ),
        withTimeout(
          async () => {
            return await supabase
              .from('resources')
              .select('id', { count: 'exact', head: true })
              .eq('professor_id', user.id)
          },
          DATA_FETCH_TIMEOUT_MS
        ),
        withTimeout(
          async () => {
            return await supabase
              .from('profiles')
              .select('id', { count: 'exact', head: true })
              .eq('role', 'teacher')
              .neq('id', user.id)
          },
          DATA_FETCH_TIMEOUT_MS
        )
      ])

      if (requestId !== requestIdRef.current) return

      if (projectsCount.error) throw projectsCount.error
      if (resourcesCount.error) throw resourcesCount.error
      if (profilesCount.error) throw profilesCount.error

      setStats({
        projects: projectsCount.count ?? 0,
        resources: resourcesCount.count ?? 0,
        collaborators: profilesCount.count ?? 0,
      })
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      console.error('Error fetching dashboard stats:', err)
      setError(err instanceof Error && err.message === 'timeout'
        ? 'Tiempo de espera agotado al cargar estadísticas'
        : err instanceof Error ? err.message : 'Error al cargar estadísticas')
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [user?.id, initialized])

  useEffect(() => {
    if (!initialized) return
    fetchStats()
  }, [initialized, user?.id, fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}