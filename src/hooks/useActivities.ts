import { useState, useEffect, useCallback } from 'react'
import { activitiesService } from '../services/activities.service'
import { useAuthStore } from '../store/authStore'
import type { Activity } from '../types'

interface UseActivitiesOptions {
  limit?: number
  searchTerm?: string
  professorId?: string
  viewAll?: boolean
}

interface UseActivitiesReturn {
  activities: Activity[]
  totalCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useActivities = ({
  limit = 10,
  searchTerm = '',
  professorId: explicitProfessorId,
  viewAll = false,
}: UseActivitiesOptions = {}): UseActivitiesReturn => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = useAuthStore((state) => state.user)

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let data: Activity[] = []

      if (viewAll && user?.role === 'admin') {
        data = await activitiesService.getAllActivities()
      } else {
        const userId = explicitProfessorId ?? user?.id
        if (userId) {
          data = await activitiesService.getMyActivities(userId)
        }
      }

      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase()
        data = data.filter(
          (a) =>
            a.title.toLowerCase().includes(term) ||
            (a.description && a.description.toLowerCase().includes(term))
        )
      }

      setActivities(data.slice(0, limit))
      setTotalCount(data.length)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar actividades'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.role, limit, searchTerm, explicitProfessorId, viewAll])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const refetch = useCallback(async () => {
    await fetchActivities()
  }, [fetchActivities])

  return { activities, totalCount, loading, error, refetch }
}
