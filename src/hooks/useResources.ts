import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { restSelect, restCount } from '../utils/supabaseRest'
import type { Resource } from '../types'

interface UseResourcesOptions {
  limit?: number
  searchTerm?: string
  professorId?: string
  viewAll?: boolean
}

interface UseResourcesReturn {
  resources: Resource[]
  totalCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useResources = ({
  limit = 10,
  searchTerm = '',
  professorId: explicitProfessorId,
  viewAll = false,
}: UseResourcesOptions = {}): UseResourcesReturn => {
  const [resources, setResources] = useState<Resource[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = useAuthStore((state) => state.user)
  const userId = explicitProfessorId ?? user?.id
  const requestIdRef = useRef(0)

  const fetchResources = useCallback(async () => {
    if (viewAll && user?.role === 'admin') {
      // Admin view all - no professor_id filter
      const requestId = ++requestIdRef.current

      try {
        setLoading(true)
        setError(null)

        let queryString = `select=*,professor:profiles(full_name,avatar_url)&order=created_at.desc`

        if (searchTerm.trim()) {
          const term = searchTerm.trim()
          queryString += `&or=(title.ilike.%25${encodeURIComponent(term)}%25,description.ilike.%25${encodeURIComponent(term)}%25)`
        }

        if (limit !== undefined && limit > 0) {
          queryString += `&limit=${limit}`
        }

        const [dataResult, countResult] = await Promise.allSettled([
          restSelect<Resource>('resources', queryString),
          restCount('resources', {}),
        ])

        if (requestId !== requestIdRef.current) return

        const resourcesData = dataResult.status === 'fulfilled' ? dataResult.value : []
        const countData = countResult.status === 'fulfilled' ? countResult.value : 0

        const hasRejectedRequest = dataResult.status === 'rejected' || countResult.status === 'rejected'

        setResources(resourcesData)
        setTotalCount(countData)

        if (hasRejectedRequest) {
          setError('Algunos datos no están disponibles temporalmente')
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return

        const message = err instanceof Error ? err.message : 'Error al cargar recursos'
        setError(message)
        setResources([])
        setTotalCount(0)
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    } else if (userId) {
      // User's own resources
      const requestId = ++requestIdRef.current

      try {
        setLoading(true)
        setError(null)

        let queryString = `select=*,professor:profiles(full_name,avatar_url)&professor_id=eq.${userId}&order=created_at.desc`

        if (searchTerm.trim()) {
          const term = searchTerm.trim()
          queryString += `&or=(title.ilike.%25${encodeURIComponent(term)}%25,description.ilike.%25${encodeURIComponent(term)}%25)`
        }

        if (limit !== undefined && limit > 0) {
          queryString += `&limit=${limit}`
        }

        const [dataResult, countResult] = await Promise.allSettled([
          restSelect<Resource>('resources', queryString),
          restCount('resources', { professor_id: `eq.${userId}` }),
        ])

        if (requestId !== requestIdRef.current) return

        const resourcesData = dataResult.status === 'fulfilled' ? dataResult.value : []
        const countData = countResult.status === 'fulfilled' ? countResult.value : 0

        const hasRejectedRequest = dataResult.status === 'rejected' || countResult.status === 'rejected'

        setResources(resourcesData)
        setTotalCount(countData)

        if (hasRejectedRequest) {
          setError('Algunos datos no están disponibles temporalmente')
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return

        const message = err instanceof Error ? err.message : 'Error al cargar recursos'
        setError(message)
        setResources([])
        setTotalCount(0)
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    } else {
      setLoading(false)
    }
  }, [user?.id, user?.role, limit, searchTerm, explicitProfessorId, viewAll, userId])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  const refetch = useCallback(async () => {
    await fetchResources()
  }, [fetchResources])

  return { resources, totalCount, loading, error, refetch }
}