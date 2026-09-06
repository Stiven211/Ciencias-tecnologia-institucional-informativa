import { useState, useEffect, useCallback } from 'react'
import { publicationsService } from '../services/publications.service'
import { useAuthStore } from '../store/authStore'
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

  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let data: Publication[] = []

      if (viewAll && user?.role === 'admin') {
        data = await publicationsService.getAllPublications()
      } else {
        const userId = explicitProfessorId ?? user?.id
        if (userId) {
          data = await publicationsService.getMyPublications(userId)
        }
      }

      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase()
        data = data.filter(
          (p) =>
            p.title.toLowerCase().includes(term) ||
            (p.excerpt && p.excerpt.toLowerCase().includes(term))
        )
      }

      setPublications(data.slice(0, limit))
      setTotalCount(data.length)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar publicaciones'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.role, limit, searchTerm, explicitProfessorId, viewAll])

  useEffect(() => {
    fetchPublications()
  }, [fetchPublications])

  const refetch = useCallback(async () => {
    await fetchPublications()
  }, [fetchPublications])

  return { publications, totalCount, loading, error, refetch }
}
