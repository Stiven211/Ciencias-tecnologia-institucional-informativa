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
    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((_) => (
        <div key={_} className="bg-white rounded-xl p-4 sm:p-6 animate-pulse border border-navy-200">
          <div className="h-40 sm:h-48 bg-navy-50 rounded-lg mb-3 sm:mb-4"></div>
          <h3 className="text-navy-900 font-semibold mb-1.5 sm:mb-2">Título del proyecto</h3>
          <p className="text-navy-500 text-sm line-clamp-3">Descripción breve del proyecto...</p>
          <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
            <span className="px-2 py-1 bg-navy-100 text-navy-600 text-xs rounded-full">Área</span>
          </div>
        </div>
      ))}
    </div>
  )

  if (projects.length === 0) return (
    <div className="text-center py-12">
      <p className="text-navy-500">Próximamente se publicarán proyectos destacados</p>
    </div>
  )

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-navy-900">Proyectos Destacados</h2>
        <Link to="/projects" className="text-blue-500 hover:text-blue-600 font-medium text-sm">
          Ver todos →
        </Link>
      </div>
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="group">
            <Link
              to={`/projects/${project.slug}`}
              className="block bg-white rounded-xl overflow-hidden border border-navy-200 hover:border-green-200 hover:shadow-lg transition-all"
            >
              {project.cover_image && (
                <img
                  src={project.cover_image}
                  alt={project.title}
                  className="w-full h-40 sm:h-48 object-cover"
                />
              )}
              <div className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-navy-900 mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-sm text-navy-600 mb-3 sm:mb-4 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  {project.professor && (
                    <>
                      {project.professor.avatar_url ? (
                        <img
                          src={project.professor.avatar_url}
                          alt={project.professor.full_name}
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-7 w-7 sm:h-8 sm:w-8 bg-navy-100 rounded-full flex items-center justify-center">
                          <span className="text-navy-600 text-xs sm:text-sm font-medium">
                            {project.professor.full_name?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="text-navy-700 text-xs sm:text-sm font-medium truncate">
                        {project.professor.full_name}
                      </span>
                    </>
                  )}
                </div>
                {project.categories && project.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {project.categories.slice(0, 3).map((cat, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-navy-100 text-navy-700 text-xs rounded-full"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}