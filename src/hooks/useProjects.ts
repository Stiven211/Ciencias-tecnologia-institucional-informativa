import { useState, useEffect, useCallback } from 'react'
import { projectsService } from '../services/projects.service'
import { useAuthStore } from '../store/authStore'
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

  const fetchProjects = useCallback(async () => {
    console.log('[useProjects] fetchProjects called for userId:', userId)
    try {
      setLoading(true)
      setError(null)

      const options: any = {
        limit,
        searchTerm: searchTerm.trim(),
      }

      if (userId) {
        options.professorId = userId
      }

      if (filterStatus !== 'all') {
        options.status = filterStatus
      }

      console.log('[useProjects] Fetching with options:', options)
      const result = await projectsService.getProjects(options)
      setProjects(result.data)
      setTotalCount(result.count ?? 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching projects'
      console.error('[useProjects] Error:', err)
      setError(message)
    } finally {
      setLoading(false)
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