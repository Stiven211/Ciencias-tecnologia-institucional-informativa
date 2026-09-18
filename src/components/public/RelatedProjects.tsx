import { useEffect, useState, useCallback } from 'react'
import { PublicProjectCard } from './PublicProjectCard'
import { restSelect } from '../../utils/supabaseRest'
import type { Project } from '../../types'

interface RelatedProjectsProps {
  project: Project
}

export const RelatedProjects = ({ project }: RelatedProjectsProps) => {
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRelatedProjects = useCallback(async () => {
    if (!project.technologies || project.technologies.length === 0) {
      setRelatedProjects([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const techs = project.technologies.map(t => `"${t}"`).join(',')
      const queryString = `select=*,professor:profiles(full_name,avatar_url)&status=eq.published&neq=id.${project.id}&technologies.cs.{${techs}}&order=created_at.desc&limit=3`
      const data = await restSelect<Project>('projects', queryString, { mode: 'anon' })
      setRelatedProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando proyectos relacionados')
      console.error('Error loading related projects:', err)
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    loadRelatedProjects()
  }, [loadRelatedProjects])

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