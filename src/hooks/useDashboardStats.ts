import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { dashboardService, type DashboardStats } from '../services/dashboard.service'

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

      const data = await dashboardService.getDashboardStats(user.id)

      if (requestId !== requestIdRef.current) return

      setStats(data)
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