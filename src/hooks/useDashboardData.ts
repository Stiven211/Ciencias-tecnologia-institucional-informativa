import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { dashboardService, type DashboardData } from '../services/dashboard.service'

export const useDashboardData = () => {
  const { user, initialized } = useAuthStore()
  const requestIdRef = useRef(0)

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
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

      const dashboardData = await dashboardService.getDashboardData(user.id)

      if (requestId !== requestIdRef.current) return

      setData(dashboardData)
    } catch (err) {
      if (requestId !== requestIdRef.current) return

      console.warn('Dashboard data fetch issue:', err)

      const message = err instanceof Error ? err.message : 'Error al cargar datos del dashboard'
      setError(message)

      setData({
        recentProjects: [],
        recentResources: [],
        recentPublications: [],
      })
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [user?.id, initialized])

  useEffect(() => {
    if (!initialized) return
    fetchData()
  }, [initialized, user?.id, fetchData])

  return { data, loading, error, refetch: fetchData }
}