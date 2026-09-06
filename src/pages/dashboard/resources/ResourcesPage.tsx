import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useResources } from '../../../hooks/useResources'
import { resourcesService } from '../../../services/resources.service'
import { ResourceCard } from '../../../components/resources/ResourceCard'
import { DeleteResourceModal } from '../../../components/resources/DeleteResourceModal'
import { LoadingSpinnerCentered } from '../../../components/ui/LoadingSpinner'
import { Pagination } from '../../../components/ui/Pagination'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../store/authStore'
import type { Resource } from '../../../types'

export const ResourcesPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; resource?: Resource }>({ open: false })
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewAll, setViewAll] = useState(false)
  const itemsPerPage = 10

  const { resources, totalCount, loading, error, refetch } = useResources({
    searchTerm,
    viewAll: viewAll && user?.role === 'admin',
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleDelete = async () => {
    if (!deleteModal.resource || !user?.id) return

    try {
      setIsDeleting(true)
      await resourcesService.deleteResource(deleteModal.resource.id, {
        userId: user.id,
        isAdmin: user.role === 'admin',
      })
      await refetch()
      setDeleteModal({ open: false })
    } catch (err) {
      console.error('Error deleting resource:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) return <LoadingSpinnerCentered text="Cargando recursos..." />
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            {viewAll && user?.role === 'admin' ? 'Todos los recursos' : 'Mis Recursos'}
          </h1>
          <p className="text-navy-600">{totalCount} recursos en total</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && (
            <Button
              variant="outline"
              onClick={() => setViewAll(!viewAll)}
            >
              {viewAll ? 'Ver mis recursos' : 'Ver todos'}
            </Button>
          )}
          <Button onClick={() => navigate('/dashboard/resources/new')}>
            <Plus size={16} className="mr-2" />
            Nuevo recurso
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            icon={<Search size={20} />}
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="text-navy-400" />
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">No hay recursos</h3>
          <p className="text-navy-600 mb-6 max-w-sm">
            Aún no has creado ningún recurso. Comienza creando tu primer recurso académico.
          </p>
          <Button onClick={() => navigate('/dashboard/resources/new')}>
            <Plus size={16} className="mr-2" />
            Crear primer recurso
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource: Resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onDelete={(r) => setDeleteModal({ open: true, resource: r })}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <p className="text-navy-600 text-sm">
              Mostrando {resources.length} de {totalCount} recursos
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

      <DeleteResourceModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        onConfirm={handleDelete}
        resourceTitle={deleteModal.resource?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}
