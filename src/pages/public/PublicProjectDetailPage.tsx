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
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-96 w-full bg-navy-50 rounded-lg"></div>
          </div>
        </main>
      )}
      {error && !loading && (
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <div className="text-center text-red-600 bg-red-50 rounded-lg p-8">
            <h3 className="text-xl font-bold mb-4">Error al cargar el proyecto</h3>
            <p>{error}</p>
          </div>
        </main>
      )}
      {!project && !loading && !error && (
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <div className="text-center text-navy-500">
            <h3 className="text-xl font-bold mb-4">Proyecto no encontrado</h3>
            <p>El proyecto solicitado no existe o no está disponible.</p>
          </div>
        </main>
      )}
      {project && !loading && !error && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose prose-navy max-w-none">
          {project.cover_image && (
            <img
              src={project.cover_image}
              alt={project.title}
              className="w-full h-64 object-cover rounded-2xl mb-8"
            />
          )}
          
          <h1 className="text-4xl font-bold text-navy-900 mb-6">
            {project.title}
          </h1>
          
          <div className="flex items-center space-x-4 mb-6 text-navy-600">
            {project.professor && (
              <>
                {project.professor.avatar_url ? (
                  <img
                    src={project.professor.avatar_url}
                    alt={project.professor.full_name}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-500 text-lg font-bold">
                      {project.professor.full_name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <Link 
                    to={`/profesor/${project.professor_id}`}
                    className="font-semibold hover:text-green-600 block"
                  >
                    {project.professor.full_name}
                  </Link>
                  <p className="text-sm">{project.professor.specialization || 'Especialista en área'}</p>
                </div>
              </>
            )}
            <span className="ml-4 text-navy-400">
              {new Date(project.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          
          {project.description && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-navy-900 mb-3">
                Descripción
              </h2>
              <p className="text-navy-600 lead">
                {project.description}
              </p>
            </div>
          )}
          
          {project.content && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-navy-900 mb-3">
                Contenido detallado
              </h2>
              <div
                dangerouslySetInnerHTML={{ __html: project.content }}
                className="prose prose-navy max-w-none"
              />
            </div>
          )}
          
          {project.technologies && project.technologies.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-navy-900 mb-3">
                Tecnologías utilizadas
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-green-50 text-green-800 text-sm font-medium rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {project.gallery_images && project.gallery_images.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-navy-900 mb-3">
                Galería de imágenes
              </h2>
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
          
          {/* Related Projects Section */}
          <RelatedProjects project={project} />
        </article>
      </main>
      )}
    </PublicLayout>
  )
}