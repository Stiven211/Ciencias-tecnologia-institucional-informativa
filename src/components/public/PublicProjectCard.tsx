import { Link } from 'react-router-dom'
import type { Project } from '../../types'

interface PublicProjectCardProps {
  project: Project
}

export const PublicProjectCard = ({ project }: PublicProjectCardProps) => {
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group block hover:shadow-lg transition-shadow"
    >
      <div className="bg-white rounded-lg overflow-hidden">
        {project.cover_image && (
          <img
            src={project.cover_image}
            alt={project.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-3">
            {project.professor && (
              <>
                {project.professor.avatar_url ? (
                  <img
                    src={project.professor.avatar_url}
                    alt={project.professor.full_name}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-500">
                      {project.professor.full_name?.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-navy-700 font-medium">
                  {project.professor.full_name}
                </span>
              </>
            )}
          </div>
          <h3 className="text-navy-900 font-semibold mb-2 line-clamp-2 hover:text-green-600 transition-colors group-hover:text-green-600">
            {project.title}
          </h3>
          <p className="text-navy-600 text-sm mb-4 line-clamp-3">
            {project.description}
          </p>
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
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
          <div className="mt-4 pt-3 border-t border-navy-50">
            <span className="text-navy-500 text-sm">
              {new Date(project.updated_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}