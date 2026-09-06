import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePublications } from '../../../hooks/usePublications'
import { publicationsService } from '../../../services/publications.service'
import { PublicationCard } from '../../../components/publications/PublicationCard'
import { DeletePublicationModal } from '../../../components/publications/DeletePublicationModal'
import { LoadingSpinnerCentered } from '../../../components/ui/LoadingSpinner'
import { Pagination } from '../../../components/ui/Pagination'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../store/authStore'
import type { Publication } from '../../../types'

export const PublicationsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; publication?: Publication }>({ open: false })
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewAll, setViewAll] = useState(false)
  const itemsPerPage = 10

  const { publications, totalCount, loading, error, refetch } = usePublications({
    searchTerm,
    viewAll: viewAll && user?.role === 'admin',
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleDelete = async () => {
    if (!deleteModal.publication || !user?.id) return

    try {
      setIsDeleting(true)
      await publicationsService.deletePublication(deleteModal.publication.id, {
        userId: user.id,
        isAdmin: user.role === 'admin',
      })
      await refetch()
      setDeleteModal({ open: false })
    } catch (err) {
      console.error('Error deleting publication:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) return <LoadingSpinnerCentered text="Cargando publicaciones..." />
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            {viewAll && user?.role === 'admin' ? 'Todas las publicaciones' : 'Mis Publicaciones'}
          </h1>
          <p className="text-navy-600">{totalCount} publicaciones en total</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && (
            <Button
              variant="outline"
              onClick={() => setViewAll(!viewAll)}
            >
              {viewAll ? 'Ver mis publicaciones' : 'Ver todas'}
            </Button>
          )}
          <Button onClick={() => navigate('/dashboard/publications/new')}>
            <Plus size={16} className="mr-2" />
            Nueva publicación
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            icon={<Search size={20} />}
            placeholder="Buscar publicaciones..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {publications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="text-navy-400" />
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">No hay publicaciones</h3>
          <p className="text-navy-600 mb-6 max-w-sm">
            Aún no has creado ninguna publicación. Comienza creando tu primera publicación académica.
          </p>
          <Button onClick={() => navigate('/dashboard/publications/new')}>
            <Plus size={16} className="mr-2" />
            Crear primera publicación
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publications.map((publication: Publication) => (
              <PublicationCard
                key={publication.id}
                publication={publication}
                onDelete={(p) => setDeleteModal({ open: true, publication: p })}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <p className="text-navy-600 text-sm">
              Mostrando {publications.length} de {totalCount} publicaciones
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalCount}
            />
          </div>
        </>
      )}

      <DeletePublicationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        onConfirm={handleDelete}
        publicationTitle={deleteModal.publication?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}
