import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicService } from '../../services/public.service'
import { PublicLayout } from '../../components/layout/PublicLayout'

export const PublicPublicationDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [publication, setPublication] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPublication = async () => {
      if (!id) return

      setLoading(true)
      setError(null)
      try {
        const data = await publicService.getPublishedPublicationById(id)
        setPublication(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando publicación')
      } finally {
        setLoading(false)
      }
    }

    loadPublication()
  }, [id])

  return (
    <PublicLayout>
      {loading && (
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-navy-50">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-navy-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-navy-600">Cargando publicación...</p>
          </div>
        </main>
      )}
      {error && !loading && (
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <div className="text-center text-red-600 bg-red-50 rounded-lg p-8 border border-red-200">
            <h3 className="text-xl font-semibold mb-2">Error al cargar la publicación</h3>
            <p>{error}</p>
          </div>
        </main>
      )}
      {!publication && !loading && !error && (
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <div className="text-center text-navy-500">
            <h3 className="text-xl font-semibold mb-2">Publicación no encontrada</h3>
            <p>La publicación solicitada no existe o no está disponible.</p>
          </div>
        </main>
      )}
      {publication && !loading && !error && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <article className="bg-white rounded-2xl border border-navy-200 p-8">
            {publication.cover_image && (
              <img
                src={publication.cover_image}
                alt={publication.title}
                className="w-full h-64 object-cover rounded-lg mb-8"
              />
            )}

            <h1 className="text-3xl font-bold text-navy-900 mb-4">
              {publication.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 mb-6 text-navy-600">
              {publication.professor && (
                <div className="flex items-center space-x-3">
                  {publication.professor.avatar_url ? (
                    <img
                      src={publication.professor.avatar_url}
                      alt={publication.professor.full_name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-navy-100 rounded-full flex items-center justify-center">
                      <span className="text-navy-600 font-medium text-sm">
                        {publication.professor.full_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <Link 
                    to={`/profesor/${publication.professor_id}`}
                    className="font-medium hover:text-blue-500"
                  >
                    {publication.professor.full_name}
                  </Link>
                  <span className="text-navy-400">•</span>
                </div>
              )}
              <span className="text-navy-600 text-sm">
                {publication.published_at
                  ? new Date(publication.published_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : new Date(publication.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
              </span>
            </div>

            {publication.excerpt && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-navy-900 mb-3">Extracto</h2>
                <p className="text-navy-700 leading-relaxed">
                  {publication.excerpt}
                </p>
              </div>
            )}

            {publication.content && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-navy-900 mb-3">Contenido</h2>
                <div
                  dangerouslySetInnerHTML={{ __html: publication.content }}
                  className="prose prose-navy max-w-none"
                />
              </div>
            )}
          </article>
        </main>
      )}
    </PublicLayout>
  )
}
