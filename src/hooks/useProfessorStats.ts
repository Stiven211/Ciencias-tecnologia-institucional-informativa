import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { dashboardService, type ProfessorStats } from '../services/dashboard.service'

export const useProfessorStats = () => {
  const { user } = useAuthStore()

  const [stats, setStats] = useState<ProfessorStats>({
    projects: 0,
    published: 0,
    drafts: 0,
    resources: 0,
    publications: 0,
    activities: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await dashboardService.getProfessorStats(user.id)

        setStats(data)
      } catch (err) {
        console.error('Error fetching professor stats:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.id])

  return { stats, loading, error }
}