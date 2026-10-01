import { useEffect, useState, useCallback, useMemo } from 'react'
import { PublicProjectCard } from './PublicProjectCard'
import { restSelect } from '../../utils/supabaseRest'
import type { Project } from '../../types'
import { AlertTriangle } from 'lucide-react'

interface PublicProjectsGridProps {
  filters: {
    search: string
    technologies: string[]
  }
}

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export const PublicProjectsGrid = ({ filters }: PublicProjectsGridProps) => {
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await restSelect<Project>(
        'projects',
        'select=*,professor:profiles(full_name,avatar_url)&status=eq.published&order=created_at.desc',
        { mode: 'anon' }
      )
      setAllProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando proyectos')
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const projects = useMemo(() => {
    const term = normalize(filters.search ?? '')
    const selectedTechs = (filters.technologies ?? []).map(normalize)

    return allProjects.filter((project) => {
      const technologies = (project.technologies ?? []).map(normalize)
      const professorName = normalize(project.professor?.full_name ?? '')

      const matchesSearch =
        term.length === 0 ||
        normalize(project.title ?? '').includes(term) ||
        normalize(project.description ?? '').includes(term) ||
        professorName.includes(term) ||
        technologies.some((tech) => tech.includes(term))

      const matchesTech =
        selectedTechs.length === 0 || selectedTechs.some((tech) => technologies.includes(tech))

      return matchesSearch && matchesTech
    })
  }, [allProjects, filters.search, filters.technologies])

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