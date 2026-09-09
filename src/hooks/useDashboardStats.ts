import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../store/authStore'
import { withTimeout, DATA_FETCH_TIMEOUT_MS } from '../utils/fetchTimeout'

const SESSION_CHECK_TIMEOUT_MS = 8000

interface DashboardStats {
  projects: number
  resources: number
  collaborators: number
}

export const useDashboardStats = () => {
  const { user } = useAuthStore()

  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    resources: 0,
    collaborators: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Verificar que hay sesión válida en Supabase antes de hacer queries
      const session = await withTimeout(
        async () => (await supabase.auth.getSession()).data.session,
        SESSION_CHECK_TIMEOUT_MS
      )

      if (!session) {
        setError('Sesión no disponible. Vuelve a iniciar sesión.')
        setLoading(false)
        return
      }

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

      if (projectsCount.error) throw projectsCount.error
      if (resourcesCount.error) throw resourcesCount.error
      if (profilesCount.error) throw profilesCount.error

      setStats({
        projects: projectsCount.count ?? 0,
        resources: resourcesCount.count ?? 0,
        collaborators: profilesCount.count ?? 0,
      })
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(err instanceof Error && err.message === 'timeout'
        ? 'Tiempo de espera agotado al cargar estadísticas'
        : err instanceof Error ? err.message : 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}