import { Link } from 'react-router-dom'
import type { Project } from '../../types'

interface PublicProjectCardProps {
  project: Project
}

export const PublicProjectCard = ({ project }: PublicProjectCardProps) => {
  return (
    <div className="group block hover:shadow-lg transition-shadow rounded-xl border border-navy-200 overflow-hidden">
      <Link
        to={`/projects/${project.slug}`}
        className="block bg-white"
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
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {project.technologies.map((tech: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
          <div className="pt-2 sm:pt-3 border-t border-navy-100">
            <span className="text-navy-500 text-xs sm:text-sm">
              {new Date(project.updated_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </Link>
      {project.professor && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <Link 
            to={`/profesor/${project.professor_id}`}
            className="inline-flex items-center space-x-2 text-sm text-navy-700 font-medium hover:text-green-600 transition-colors"
          >
            {project.professor.avatar_url ? (
              <img
                src={project.professor.avatar_url}
                alt={project.professor.full_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center">
                <span className="text-navy-600 text-xs font-medium">
                  {project.professor.full_name?.charAt(0)}
                </span>
              </div>
            )}
            <span>{project.professor.full_name}</span>
          </Link>
        </div>
      )}
    </div>
  )
}