import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useActivities } from '../../../hooks/useActivities'
import { activitiesService } from '../../../services/activities.service'
import { ActivityCard } from '../../../components/activities/ActivityCard'
import { DeleteActivityModal } from '../../../components/activities/DeleteActivityModal'
import { LoadingSpinnerCentered } from '../../../components/ui/LoadingSpinner'
import { Pagination } from '../../../components/ui/Pagination'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../store/authStore'
import type { Activity } from '../../../types'

export const ActivitiesPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; activity?: Activity }>({ open: false })
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewAll, setViewAll] = useState(false)
  const itemsPerPage = 10

  const { activities, totalCount, loading, error, refetch } = useActivities({
    searchTerm,
    viewAll: viewAll && user?.role === 'admin',
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleDelete = async () => {
    if (!deleteModal.activity || !user?.id) return

    try {
      setIsDeleting(true)
      await activitiesService.deleteActivity(deleteModal.activity.id, {
        userId: user.id,
        isAdmin: user.role === 'admin',
      })
      await refetch()
      setDeleteModal({ open: false })
    } catch (err) {
      console.error('Error deleting activity:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) return <LoadingSpinnerCentered text="Cargando actividades..." />
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            {viewAll && user?.role === 'admin' ? 'Todas las actividades' : 'Mis Actividades'}
          </h1>
          <p className="text-navy-600">{totalCount} actividades en total</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && (
            <Button
              variant="outline"
              onClick={() => setViewAll(!viewAll)}
            >
              {viewAll ? 'Ver mis actividades' : 'Ver todas'}
            </Button>
          )}
          <Button onClick={() => navigate('/dashboard/activities/new')}>
            <Plus size={16} className="mr-2" />
            Nueva actividad
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            icon={<Search size={20} />}
            placeholder="Buscar actividades..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="text-navy-400" />
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">No hay actividades</h3>
          <p className="text-navy-600 mb-6 max-w-sm">
            Aún no has creado ninguna actividad. Comienza creando tu primera actividad académica.
          </p>
          <Button onClick={() => navigate('/dashboard/activities/new')}>
            <Plus size={16} className="mr-2" />
            Crear primera actividad
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity: Activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onDelete={(a) => setDeleteModal({ open: true, activity: a })}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <p className="text-navy-600 text-sm">
              Mostrando {activities.length} de {totalCount} actividades
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

      <DeleteActivityModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        onConfirm={handleDelete}
        activityTitle={deleteModal.activity?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}
