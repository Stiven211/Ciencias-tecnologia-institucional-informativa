import { useState, useEffect, useCallback } from 'react'
import { projectsService } from '../services/projects.service'
import type { Project } from '../types'

interface UseProjectsOptions {
  professorId?: string
  limit?: number
  searchTerm?: string
  filterStatus?: string
}

interface UseProjectsReturn {
  projects: Project[]
  totalCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useProjects = ({
  professorId,
  limit = 10,
  searchTerm = '',
  filterStatus = 'all'
}: UseProjectsOptions = {}): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const options: any = {
        limit,
        searchTerm: searchTerm.trim(),
        professorId
      }
      
      if (filterStatus !== 'all') {
        options.status = filterStatus
      }
      
       const result = await projectsService.getProjects(options)
       setProjects(result.data)
       setTotalCount(result.count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching projects')
      console.error('Error in useProjects:', err)
    } finally {
      setLoading(false)
    }
  }, [professorId, limit, searchTerm, filterStatus])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const refetch = useCallback(async () => {
    await fetchProjects()
  }, [fetchProjects])

  return { projects, totalCount, loading, error, refetch }
}