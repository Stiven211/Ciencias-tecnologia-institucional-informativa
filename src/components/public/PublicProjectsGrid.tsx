import { useEffect, useState, useCallback } from 'react'
import { PublicProjectCard } from './PublicProjectCard'
import { publicService } from '../../services/public.service'
import type { Project } from '../../types'
import { withTimeout, DATA_FETCH_TIMEOUT_MS } from '../../utils/fetchTimeout'
import { AlertTriangle } from 'lucide-react'

interface PublicProjectsGridProps {
  filters: {
    search: string
    technologies: string[]
    categories: string[]
  }
}

export const PublicProjectsGrid = ({ filters }: PublicProjectsGridProps) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await withTimeout<Project[]>(
        publicService.getPublicProjects(filters),
        DATA_FETCH_TIMEOUT_MS
      )
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error && err.message === 'timeout'
        ? 'Tiempo de espera agotado al cargar proyectos'
        : err instanceof Error ? err.message : 'Error cargando proyectos')
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  if (loading) return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((_) => (
        <div key={_} className="bg-navy-50 rounded-lg p-6 animate-pulse">
          <div className="h-48 bg-green-500/10 rounded-lg mb-4"></div>
          <h3 className="text-navy-900 font-semibold mb-2">Título del proyecto</h3>
          <p className="text-navy-500 line-clamp-3">Descripción breve del proyecto...</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">Tech</span>
          </div>
        </div>
      ))}
    </div>
  )

  if (error) return (
    <div className="p-6 text-red-600 bg-red-50 rounded-lg">
      <div className="flex items-center justify-between">
        <AlertTriangle size={20} className="mr-3 flex-shrink-0" />
        <div className="flex items-center gap-2">
          {error}
          <button
            onClick={loadProjects}
            className="ml-4 text-sm text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  )

  if (projects.length === 0) return (
    <div className="text-center py-12">
      {filters.technologies.length > 0 ? (
        <p className="text-navy-500">
          No se encontraron proyectos para <strong>{filters.technologies.join(', ')}</strong>
        </p>
      ) : (
        <p className="text-navy-500">No se encontraron proyectos con los filtros aplicados</p>
      )}
    </div>
  )

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <PublicProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}