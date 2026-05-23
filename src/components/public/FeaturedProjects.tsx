import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicService } from '../../services/public.service'
import type { Project } from '../../types'

export const FeaturedProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await publicService.getFeaturedProjects()
        setProjects(data)
      } catch (err) {
        console.error('Error loading featured projects:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  if (loading) return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((_) => (
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

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          to={`/projects/${project.slug}`}
          className="group"
        >
          <div className="bg-white rounded-lg overflow-hidden shadow-hover hover:shadow-lg transition-shadow">
            {project.cover_image && (
              <img
                src={project.cover_image}
                alt={project.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-navy-900 font-semibold mb-2 line-clamp-2">
                {project.title}
              </h3>
              <p className="text-navy-600 text-sm mb-4 line-clamp-3">
                {project.description}
              </p>
              <div className="flex items-center space-x-3 mb-4">
                {project.professor && (
                  <>
                    {project.professor.avatar_url ? (
                      <img
                        src={project.professor.avatar_url}
                        alt={project.professor.full_name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-green-500">
                          {project.professor.full_name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-navy-700 text-sm">
                      {project.professor.full_name}
                    </span>
                  </>
                )}
              </div>
              {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}