import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicService } from '../../services/public.service'
import { RelatedProjects } from '../../components/public/RelatedProjects'
import type { Project } from '../../types'
import { PublicLayout } from '../../components/layout/PublicLayout'

export const PublicProjectDetailPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProject = async () => {
      if (!slug) return
      
      setLoading(true)
      setError(null)
      try {
        const data = await publicService.getPublicProjectBySlug(slug)
        setProject(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando proyecto')
        console.error('Error loading project:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [slug])

  return (
    <PublicLayout>
      {loading && (
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-navy-50">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-navy-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-navy-600">Cargando proyecto...</p>
          </div>
        </main>
      )}
      {error && !loading && (
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <div className="text-center text-red-600 bg-red-50 rounded-lg p-8 border border-red-200">
            <h3 className="text-xl font-semibold mb-2">Error al cargar el proyecto</h3>
            <p>{error}</p>
          </div>
        </main>
      )}
      {!project && !loading && !error && (
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <div className="text-center text-navy-500">
            <h3 className="text-xl font-semibold mb-2">Proyecto no encontrado</h3>
            <p>El proyecto solicitado no existe o no está disponible.</p>
          </div>
        </main>
      )}
      {project && !loading && !error && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <article className="bg-white rounded-2xl border border-navy-200 p-8">
            {project.cover_image && (
              <img
                src={project.cover_image}
                alt={project.title}
                className="w-full h-64 object-cover rounded-lg mb-8"
              />
            )}
            
            <h1 className="text-3xl font-bold text-navy-900 mb-4">
              {project.title}
            </h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 mb-6 text-navy-600">
              {project.professor && (
                <div className="flex items-center space-x-3">
                  {project.professor.avatar_url ? (
                    <img
                      src={project.professor.avatar_url}
                      alt={project.professor.full_name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-navy-100 rounded-full flex items-center justify-center">
                      <span className="text-navy-600 font-medium text-sm">
                        {project.professor.full_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <Link 
                    to={`/profesor/${project.professor_id}`}
                    className="font-medium hover:text-blue-500"
                  >
                    {project.professor.full_name}
                  </Link>
                  <span className="text-navy-400">•</span>
                </div>
              )}
              <span className="text-navy-600 text-sm">
                {new Date(project.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            {project.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-navy-900 mb-3">Descripción</h2>
                <p className="text-navy-700 leading-relaxed">
                  {project.description}
                </p>
              </div>
            )}
            
            {project.content && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-navy-900 mb-3">Contenido detallado</h2>
                <div
                  dangerouslySetInnerHTML={{ __html: project.content }}
                  className="prose prose-navy max-w-none"
                />
              </div>
            )}
            
            {project.technologies && project.technologies.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-navy-900 mb-3">Tecnologías utilizadas</h2>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-navy-100 text-navy-700 text-sm font-medium rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {project.gallery_images && project.gallery_images.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-navy-900 mb-3">Galería de imágenes</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {project.gallery_images.map((imageUrl: string, index: number) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`${project.title} - Imagen ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </article>
          
          <RelatedProjects project={project} />
        </main>
      )}
    </PublicLayout>
  )
}