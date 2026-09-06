import { useState, useEffect } from 'react'
import { PublicLayout } from '../../components/layout/PublicLayout'
import { publicService } from '../../services/public.service'
import { PublicPublicationCard } from '../../components/public/PublicPublicationCard'
import { Input } from '../../components/ui/Input'
import { Search } from 'lucide-react'
import type { Publication } from '../../types'

export const PublicationsCatalogPage = () => {
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadPublications = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await publicService.getPublishedPublications()
        setPublications(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando publicaciones')
      } finally {
        setLoading(false)
      }
    }

    loadPublications()
  }, [])

  const filtered = searchTerm.trim()
    ? publications.filter((p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : publications

  return (
    <PublicLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900">
            Publicaciones
          </h1>
          <p className="text-navy-600 mt-2">
            Artículos y papers académicos del Área de Ciencias Naturales y Tecnología
          </p>
        </div>

        <div className="mb-6">
          <Input
            icon={<Search size={20} />}
            placeholder="Buscar publicaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((_) => (
              <div key={_} className="bg-navy-50 rounded-lg p-6 animate-pulse">
                <div className="h-48 bg-green-500/10 rounded-lg mb-4"></div>
                <h3 className="text-navy-900 font-semibold mb-2">Título de la publicación</h3>
                <p className="text-navy-500 line-clamp-3">Extracto de la publicación...</p>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="p-6 text-red-600 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-navy-500">
              {searchTerm ? 'No se encontraron publicaciones con la búsqueda aplicada' : 'No hay publicaciones publicadas aún'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((publication) => (
              <PublicPublicationCard key={publication.id} publication={publication} />
            ))}
          </div>
        )}
      </main>
    </PublicLayout>
  )
}
