import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProjectHeader } from '../../../components/projects/ProjectHeader'
import { LoadingSpinnerCentered } from '../../../components/ui/LoadingSpinner'
import { projectsService } from '../../../services/projects.service'
import { useAuthStore } from '../../../store/authStore'
import type { Project } from '../../../types'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'forbidden' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; project: Project }

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    if (!id) {
      setState({ kind: 'not-found' })
      return
    }

    let cancelled = false
    projectsService
      .getProjectById(id)
      .then((project) => {
        if (cancelled) return
        const isAdmin = user?.role === 'admin'
        const isOwner = user?.id === project.professor_id
        const isPublished = project.status === 'published'
        if (!isPublished && !isAdmin && !isOwner) {
          setState({ kind: 'forbidden' })
          return
        }
        setState({ kind: 'ready', project })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'No se pudo cargar el proyecto.'
        if (/not\s*found|0\s*row/i.test(message)) {
          setState({ kind: 'not-found' })
        } else {
          setState({ kind: 'error', message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, user?.id, user?.role])

  if (state.kind === 'loading') return <LoadingSpinnerCentered text="Cargando proyecto..." />

  if (state.kind === 'not-found') {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h2 className="text-xl font-semibold text-navy-900 mb-2">Proyecto no encontrado</h2>
        <p className="text-navy-600 mb-4">El proyecto solicitado no existe o fue eliminado.</p>
        <Link to="/dashboard/projects" className="text-green-600 hover:text-green-700 font-medium">
          Volver a mis proyectos
        </Link>
      </div>
    )
  }

  if (state.kind === 'forbidden') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-navy-900 mb-2">Sin permisos</h2>
          <p className="text-navy-600">Este proyecto aún no está publicado. Solo el autor o un administrador puede verlo.</p>
        </div>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-2">Error al cargar el proyecto</h2>
          <p>{state.message}</p>
        </div>
      </div>
    )
  }

  const project = state.project
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
            {project.technologies.map((tech: string) => (
              <span key={tech} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
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
            {project.gallery_images.map((imageUrl: string) => (
              <img
                key={imageUrl}
                src={imageUrl}
                alt="Imagen de la galería"
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}