import { useState, useEffect, useCallback, useRef } from 'react'
import type { Project, Resource, Publication } from '../types'
import { useAuthStore } from '../store/authStore'
import { restSelect } from '../utils/supabaseRest'

interface DashboardData {
  recentProjects: Project[]
  recentResources: Resource[]
  recentPublications: Publication[]
}

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

      const professorSelect = 'professor:profiles(full_name,avatar_url)'

      const results = await Promise.allSettled([
        restSelect<Project>(
          'projects',
          `select=*,${professorSelect}&professor_id=eq.${user.id}&order=created_at.desc&limit=5`
        ),
        restSelect<Resource>(
          'resources',
          `select=*,${professorSelect}&professor_id=eq.${user.id}&order=created_at.desc&limit=5`
        ),
        restSelect<Publication>(
          'publications',
          `select=*,${professorSelect}&professor_id=eq.${user.id}&order=created_at.desc&limit=5`
        ),
      ])

      if (requestId !== requestIdRef.current) return

      const projectsResult = results[0]
      const resourcesResult = results[1]
      const publicationsResult = results[2]

      const projectsData = projectsResult.status === 'fulfilled' ? projectsResult.value : []
      const resourcesData = resourcesResult.status === 'fulfilled' ? resourcesResult.value : []
      const publicationsData = publicationsResult.status === 'fulfilled' ? publicationsResult.value : []

      const hasRejectedRequest = results.some((result) => result.status === 'rejected')

      setData({
        recentProjects: projectsData,
        recentResources: resourcesData,
        recentPublications: publicationsData,
      })

      if (hasRejectedRequest) {
        setError('Algunos datos no están disponibles temporalmente')
      }
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