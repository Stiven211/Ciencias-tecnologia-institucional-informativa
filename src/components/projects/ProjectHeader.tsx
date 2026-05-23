import { Link } from 'react-router-dom'
import { ArrowLeft, Edit } from 'lucide-react'
import type { Project } from '../../types'

interface ProjectHeaderProps {
  project: Project
}

export const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  return (
    <div className="mb-8">
      <Link
        to="/dashboard/projects"
        className="inline-flex items-center text-navy-600 hover:text-navy-900 mb-4"
      >
        <ArrowLeft size={16} className="mr-1" />
        Volver a proyectos
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">{project.title}</h1>
          <p className="text-navy-600 mt-1">
            Por {project.professor?.full_name || 'Profesor'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`text-sm px-3 py-1 rounded-full ${
            project.status === 'published' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-navy-100 text-navy-800'
          }`}>
            {project.status === 'published' ? 'Publicado' : 'Borrador'}
          </span>
          
          <Link
            to={`/dashboard/projects/${project.id}/edit`}
            className="inline-flex items-center px-3 py-1.5 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors"
          >
            <Edit size={16} className="mr-1" />
            Editar
          </Link>
        </div>
      </div>
    </div>
  )
}