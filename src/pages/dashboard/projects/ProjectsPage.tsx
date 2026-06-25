import { useState } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../../../hooks/useProjects'
import { ProjectCard } from '../../../components/projects/ProjectCard'
import { EmptyProjects } from '../../../components/projects/EmptyProjects'
import { DeleteProjectModal } from '../../../components/projects/DeleteProjectModal'
import { LoadingSpinnerCentered } from '../../../components/ui/LoadingSpinner'
import { Pagination } from '../../../components/ui/Pagination'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { projectsService } from '../../../services/projects.service'
import type { Project } from '../../../types'

export const ProjectsPage = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; project?: Project }>({ open: false })
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const {
    projects,
    totalCount,
    loading,
    error,
    refetch
  } = useProjects({
    professorId: undefined,
    limit: itemsPerPage,
    searchTerm,
    filterStatus
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDelete = async () => {
    if (!deleteModal.project) return

    try {
      setIsDeleting(true)
      await projectsService.deleteProject(deleteModal.project.id)
      await refetch()
      setDeleteModal({ open: false })
    } catch (err) {
      console.error('Error deleting project:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) return <LoadingSpinnerCentered text="Cargando proyectos..." />
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Mis Proyectos</h1>
          <p className="text-navy-600">{totalCount} proyectos en total</p>
        </div>
        <Button
          onClick={() => navigate('/dashboard/projects/new')}
        >
          Nuevo proyecto
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            icon={<Search size={20} />}
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <select
          value={filterStatus}
          onChange={handleFilterChange}
          className="px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">Todos los estados</option>
          <option value="published">Publicados</option>
          <option value="draft">Borradores</option>
          <option value="archived">Archivados</option>
        </select>
      </div>

      {projects.length === 0 ? (
        <EmptyProjects />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: Project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={() => setDeleteModal({ open: true, project })}
              />
            ))}
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <p className="text-navy-600 text-sm">
              Mostrando {projects.length} de {totalCount} proyectos
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / itemsPerPage)}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={totalCount}
            />
          </div>
        </>
      )}

      <DeleteProjectModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        onConfirm={handleDelete}
        projectTitle={deleteModal.project?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}
