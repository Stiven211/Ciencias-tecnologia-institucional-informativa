import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { restSelect, restCount } from '../utils/supabaseRest'
import type { Publication } from '../types'

interface UsePublicationsOptions {
  limit?: number
  searchTerm?: string
  professorId?: string
  viewAll?: boolean
}

interface UsePublicationsReturn {
  publications: Publication[]
  totalCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const usePublications = ({
  limit = 10,
  searchTerm = '',
  professorId: explicitProfessorId,
  viewAll = false,
}: UsePublicationsOptions = {}): UsePublicationsReturn => {
  const [publications, setPublications] = useState<Publication[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = useAuthStore((state) => state.user)
  const userId = explicitProfessorId ?? user?.id
  const requestIdRef = useRef(0)

  const fetchPublications = useCallback(async () => {
    if (viewAll && user?.role === 'admin') {
      // Admin view all - no professor_id filter
      const requestId = ++requestIdRef.current

      try {
        setLoading(true)
        setError(null)

        let queryString = `select=*,professor:profiles(full_name,avatar_url)&order=created_at.desc`

        if (searchTerm.trim()) {
          const term = searchTerm.trim()
          queryString += `&or=(title.ilike.%25${encodeURIComponent(term)}%25,excerpt.ilike.%25${encodeURIComponent(term)}%25)`
        }

        if (limit !== undefined && limit > 0) {
          queryString += `&limit=${limit}`
        }

        const [dataResult, countResult] = await Promise.allSettled([
          restSelect<Publication>('publications', queryString),
          restCount('publications', {}),
        ])

        if (requestId !== requestIdRef.current) return

        const publicationsData = dataResult.status === 'fulfilled' ? dataResult.value : []
        const countData = countResult.status === 'fulfilled' ? countResult.value : 0

        const hasRejectedRequest = dataResult.status === 'rejected' || countResult.status === 'rejected'

        setPublications(publicationsData)
        setTotalCount(countData)

        if (hasRejectedRequest) {
          setError('Algunos datos no están disponibles temporalmente')
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return

        const message = err instanceof Error ? err.message : 'Error al cargar publicaciones'
        setError(message)
        setPublications([])
        setTotalCount(0)
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    } else if (userId) {
      // User's own publications
      const requestId = ++requestIdRef.current

      try {
        setLoading(true)
        setError(null)

        let queryString = `select=*,professor:profiles(full_name,avatar_url)&professor_id=eq.${userId}&order=created_at.desc`

        if (searchTerm.trim()) {
          const term = searchTerm.trim()
          queryString += `&or=(title.ilike.%25${encodeURIComponent(term)}%25,excerpt.ilike.%25${encodeURIComponent(term)}%25)`
        }

        if (limit !== undefined && limit > 0) {
          queryString += `&limit=${limit}`
        }

        const [dataResult, countResult] = await Promise.allSettled([
          restSelect<Publication>('publications', queryString),
          restCount('publications', { professor_id: `eq.${userId}` }),
        ])

        if (requestId !== requestIdRef.current) return

        const publicationsData = dataResult.status === 'fulfilled' ? dataResult.value : []
        const countData = countResult.status === 'fulfilled' ? countResult.value : 0

        const hasRejectedRequest = dataResult.status === 'rejected' || countResult.status === 'rejected'

        setPublications(publicationsData)
        setTotalCount(countData)

        if (hasRejectedRequest) {
          setError('Algunos datos no están disponibles temporalmente')
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return

        const message = err instanceof Error ? err.message : 'Error al cargar publicaciones'
        setError(message)
        setPublications([])
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
    fetchPublications()
  }, [fetchPublications])

  const refetch = useCallback(async () => {
    await fetchPublications()
  }, [fetchPublications])

  return { publications, totalCount, loading, error, refetch }
}