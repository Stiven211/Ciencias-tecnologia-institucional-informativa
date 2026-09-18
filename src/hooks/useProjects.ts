import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { restSelect, restCount } from '../utils/supabaseRest'
import type { Project } from '../types'

interface UseProjectsOptions {
  limit?: number
  searchTerm?: string
  filterStatus?: string
  professorId?: string
}

interface UseProjectsReturn {
  projects: Project[]
  totalCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useProjects = ({
  limit = 10,
  searchTerm = '',
  filterStatus = 'all',
  professorId: explicitProfessorId,
}: UseProjectsOptions = {}): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = useAuthStore((state) => state.user)
  const userId = explicitProfessorId ?? user?.id
  const requestIdRef = useRef(0)

  const fetchProjects = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    const requestId = ++requestIdRef.current

    try {
      setLoading(true)
      setError(null)

      let queryString = `select=*,professor:profiles(id,full_name,avatar_url)&professor_id=eq.${userId}&order=created_at.desc`

      if (filterStatus !== 'all') {
        queryString += `&status=eq.${filterStatus}`
      }

      if (searchTerm.trim()) {
        const term = searchTerm.trim()
        queryString += `&or=(title.ilike.%25${encodeURIComponent(term)}%25,description.ilike.%25${encodeURIComponent(term)}%25)`
      }

      if (limit !== undefined && limit > 0) {
        queryString += `&limit=${limit}`
      }

      const [dataResult, countResult] = await Promise.allSettled([
        restSelect<Project>('projects', queryString),
        restCount('projects', { professor_id: `eq.${userId}` }),
      ])

      if (requestId !== requestIdRef.current) return

      const projectsData = dataResult.status === 'fulfilled' ? dataResult.value : []
      const countData = countResult.status === 'fulfilled' ? countResult.value : 0

      const hasRejectedRequest = dataResult.status === 'rejected' || countResult.status === 'rejected'

      setProjects(projectsData)
      setTotalCount(countData)

      if (hasRejectedRequest) {
        setError('Algunos datos no están disponibles temporalmente')
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return

      const message = err instanceof Error ? err.message : 'Error al cargar proyectos'
      setError(message)
      setProjects([])
      setTotalCount(0)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [userId, limit, searchTerm, filterStatus])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const refetch = useCallback(async () => {
    await fetchProjects()
  }, [fetchProjects])

  return { projects, totalCount, loading, error, refetch }
}