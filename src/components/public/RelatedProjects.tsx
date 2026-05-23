import { useEffect, useState } from 'react'
import { PublicProjectCard } from './PublicProjectCard'
import { publicService } from '../../services/public.service'
import type { Project } from '../../types'

interface RelatedProjectsProps {
  project: Project
}

export const RelatedProjects = ({ project }: RelatedProjectsProps) => {
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRelatedProjects = async () => {
      if (!project.technologies || project.technologies.length === 0) {
        setRelatedProjects([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const data = await publicService.getRelatedProjects(
          project.id, 
          project.technologies
        )
        setRelatedProjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando proyectos relacionados')
        console.error('Error loading related projects:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRelatedProjects()
  }, [project])

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map((_) => (
        <div key={_} className="bg-navy-50 rounded-lg p-4 animate-pulse">
          <div className="h-32 bg-green-500/10 rounded-lg mb-3"></div>
          <h4 className="text-navy-900 font-semibold mb-1">Título del proyecto</h4>
          <p className="text-navy-500 text-sm line-clamp-2">Descripción breve...</p>
        </div>
      ))}
    </div>
  )

  if (error) return (
    <div className="p-4 text-red-600 bg-red-50 rounded-lg">
      {error}
    </div>
  )

  if (relatedProjects.length === 0) return null

  return (
    <div className="space-y-6">
      <h3 className="text-navy-900 font-semibold mb-4">
        Proyectos Relacionados
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatedProjects.map((relatedProject) => (
          <PublicProjectCard key={relatedProject.id} project={relatedProject} />
        ))}
      </div>
    </div>
  )
}