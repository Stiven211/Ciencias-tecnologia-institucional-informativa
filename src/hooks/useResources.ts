import { useState, useEffect, useCallback } from 'react'
import { resourcesService } from '../services/resources.service'
import { useAuthStore } from '../store/authStore'
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
  // test comment for HMR
  const [resources, setResources] = useState<Resource[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = useAuthStore((state) => state.user)

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let data: Resource[] = []

      if (viewAll && user?.role === 'admin') {
        data = await resourcesService.getAllResources()
      } else {
        const userId = explicitProfessorId ?? user?.id
        if (userId) {
          data = await resourcesService.getMyResources(userId)
        }
      }

      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase()
        data = data.filter(
          (r) =>
            r.title.toLowerCase().includes(term) ||
            (r.description && r.description.toLowerCase().includes(term))
        )
      }

      setResources(data.slice(0, limit))
      setTotalCount(data.length)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar recursos'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.role, limit, searchTerm, explicitProfessorId, viewAll])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  const refetch = useCallback(async () => {
    await fetchResources()
  }, [fetchResources])

  return { resources, totalCount, loading, error, refetch }
}
