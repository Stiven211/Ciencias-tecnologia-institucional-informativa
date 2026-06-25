import { Link } from 'react-router-dom'
import type { Project } from '../../types'

interface PublicProjectCardProps {
  project: Project
}

export const PublicProjectCard = ({ project }: PublicProjectCardProps) => {
  return (
    <div className="group block hover:shadow-lg transition-shadow">
      <Link
        to={`/projects/${project.slug}`}
        className="block bg-white rounded-lg overflow-hidden"
      >
        {project.cover_image && (
          <img
            src={project.cover_image}
            alt={project.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-6">
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
      </Link>
      {project.professor && (
        <Link 
          to={`/profesor/${project.professor_id}`}
          className="block mt-2 text-navy-700 font-medium text-sm hover:text-green-600"
        >
          Por {project.professor.full_name}
        </Link>
      )}
    </div>
  )
}