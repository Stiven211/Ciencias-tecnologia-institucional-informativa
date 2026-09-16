import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { restCount } from '../utils/supabaseRest'

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

      const results = await Promise.allSettled([
        restCount('projects', { professor_id: `eq.${user.id}` }),
        restCount('resources', { professor_id: `eq.${user.id}` }),
        restCount('profiles', { role: 'eq.teacher', id: `neq.${user.id}` }),
      ])

      if (requestId !== requestIdRef.current) return

      const projectsResult = results[0]
      const resourcesResult = results[1]
      const profilesResult = results[2]

      const projectsCount = projectsResult.status === 'fulfilled' ? projectsResult.value : 0
      const resourcesCount = resourcesResult.status === 'fulfilled' ? resourcesResult.value : 0
      const collaboratorsCount = profilesResult.status === 'fulfilled' ? profilesResult.value : 0

      const hasRejectedRequest = results.some((result) => result.status === 'rejected')

      setStats({
        projects: projectsCount,
        resources: resourcesCount,
        collaborators: collaboratorsCount,
      })

      if (hasRejectedRequest) {
        setError('Algunas estadísticas no están disponibles temporalmente')
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return

      console.warn('Dashboard stats fetch issue:', err)

      const message = err instanceof Error ? err.message : 'Error al cargar estadísticas'
      setError(message)

      setStats({
        projects: 0,
        resources: 0,
        collaborators: 0,
      })
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