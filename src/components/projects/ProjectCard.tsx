import { Link } from 'react-router-dom'
import { Edit, Trash2, Calendar } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import type { Project } from '../../types'

interface ProjectCardProps {
  project: Project
  onDelete: (project: Project) => void
}

export const ProjectCard = ({ project, onDelete }: ProjectCardProps) => {
  const { user } = useAuthStore()
  const isOwner = user?.id === project.professor_id
  const canEdit = isOwner || user?.role === 'admin'

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-navy-200 hover:shadow-md transition-shadow">
      {project.cover_image && (
        <img 
          src={project.cover_image} 
          alt={project.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-navy-900 line-clamp-1">
            {project.title}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            project.status === 'published' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-navy-100 text-navy-800'
          }`}>
            {project.status === 'published' ? 'Publicado' : 'Borrador'}
          </span>
        </div>
        
        <p className="text-navy-600 text-sm mb-4 line-clamp-2">
          {project.description || 'Sin descripción'}
        </p>

        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.technologies.slice(0, 3).map((tech, i) => (
              <span key={i} className="text-xs bg-navy-100 text-navy-700 px-2 py-1 rounded">
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="text-xs text-navy-500">+{project.technologies.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-navy-500">
          <div className="flex items-center">
            <Calendar size={14} className="mr-1" />
            <span>{new Date(project.created_at).toLocaleDateString('es-ES')}</span>
          </div>
          
          {canEdit && (
            <div className="flex items-center space-x-2">
              <Link
                to={`/dashboard/projects/${project.id}/edit`}
                className="p-1.5 rounded-lg hover:bg-navy-100 text-navy-600"
              >
                <Edit size={16} />
              </Link>
              <button
                onClick={() => onDelete(project)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}