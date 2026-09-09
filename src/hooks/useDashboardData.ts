import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Project, Resource, Publication } from '../types'
import { useAuthStore } from '../store/authStore'
import { withTimeout, DATA_FETCH_TIMEOUT_MS } from '../utils/fetchTimeout'

const SESSION_CHECK_TIMEOUT_MS = 8000

interface DashboardData {
  recentProjects: Project[]
  recentResources: Resource[]
  recentPublications: Publication[]
}

export const useDashboardData = () => {
  const { user } = useAuthStore()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
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

      if (projectsResult.error) throw projectsResult.error
      if (resourcesResult.error) throw resourcesResult.error
      if (publicationsResult.error) throw publicationsResult.error

      setData({
        recentProjects: projectsResult.data,
        recentResources: resourcesResult.data,
        recentPublications: publicationsResult.data
      })
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error && err.message === 'timeout'
        ? 'Tiempo de espera agotado al cargar datos'
        : err instanceof Error ? err.message : 'Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}