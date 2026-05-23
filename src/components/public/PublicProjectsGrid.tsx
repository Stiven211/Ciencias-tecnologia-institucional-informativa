import { useEffect, useState } from 'react'
import { PublicProjectCard } from './PublicProjectCard'
import { publicService } from '../../services/public.service'
import type { Project } from '../../types'

interface PublicProjectsGridProps {
  filters: {
    search: string
    technologies: string[]
  }
}

export const PublicProjectsGrid = ({ filters }: PublicProjectsGridProps) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await publicService.getPublicProjects(filters)
        setProjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando proyectos')
        console.error('Error loading projects:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [filters])

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
      {error}
    </div>
  )

  if (projects.length === 0) return (
    <div className="text-center py-12">
      <p className="text-navy-500">No se encontraron proyectos con los filtros aplicados</p>
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