import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ProjectHeader } from '../../../components/projects/ProjectHeader'
import { LoadingSpinnerCentered } from '../../../components/ui/LoadingSpinner'
import { projectsService } from '../../../services/projects.service'
import type { Project } from '../../../types'

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      projectsService.getProjectById(id)
        .then(setProject)
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading) return <LoadingSpinnerCentered text="Cargando proyecto..." />
  if (!project) return <div className="p-6">Proyecto no encontrado</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ProjectHeader project={project} />
      
      {project.cover_image && (
        <img 
          src={project.cover_image} 
          alt={project.title}
          className="w-full h-64 object-cover rounded-2xl mb-8"
        />
      )}

      <div className="prose prose-navy max-w-none">
        {project.content ? (
          <div dangerouslySetInnerHTML={{ __html: project.content }} />
        ) : (
          <p className="text-navy-600">{project.description || 'Sin contenido'}</p>
        )}
      </div>

      {project.technologies && project.technologies.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-navy-900 mb-3">Tecnologías</h3>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {project.gallery_images && project.gallery_images.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-navy-900 mb-3">Galería de imágenes</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {project.gallery_images.map((imageUrl: string, i: number) => (
              <img
                key={i}
                src={imageUrl}
                alt={`Galería ${i + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}