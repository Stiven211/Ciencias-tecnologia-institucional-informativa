import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Project, Resource, Publication } from '../types'
import { useAuthStore } from '../store/authStore'
import { withTimeout, DATA_FETCH_TIMEOUT_MS } from '../utils/fetchTimeout'

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

      const [
        projectsResult,
        resourcesResult,
        publicationsResult
      ] = await Promise.all([
        withTimeout(
          async () => {
            return await supabase
              .from('projects')
              .select(`
                *,
                professor:profiles(full_name, avatar_url)
              `)
              .eq('professor_id', user.id)
              .order('created_at', { ascending: false })
              .limit(5)
          },
          DATA_FETCH_TIMEOUT_MS
        ),
        withTimeout(
          async () => {
            return await supabase
              .from('resources')
              .select(`
                *,
                professor:profiles(full_name, avatar_url)
              `)
              .eq('professor_id', user.id)
              .order('created_at', { ascending: false })
              .limit(5)
          },
          DATA_FETCH_TIMEOUT_MS
        ),
        withTimeout(
          async () => {
            return await supabase
              .from('publications')
              .select(`
                *,
                professor:profiles(full_name, avatar_url)
              `)
              .eq('professor_id', user.id)
              .order('created_at', { ascending: false })
              .limit(5)
          },
          DATA_FETCH_TIMEOUT_MS
        )
      ])

      if (requestId !== requestIdRef.current) return

      if (projectsResult.error) throw projectsResult.error
      if (resourcesResult.error) throw resourcesResult.error
      if (publicationsResult.error) throw publicationsResult.error

      setData({
        recentProjects: projectsResult.data,
        recentResources: resourcesResult.data,
        recentPublications: publicationsResult.data
      })
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error && err.message === 'timeout'
        ? 'Tiempo de espera agotado al cargar datos'
        : err instanceof Error ? err.message : 'Error al cargar datos del dashboard')
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