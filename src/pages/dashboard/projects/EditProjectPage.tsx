import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ProjectForm } from '../../../components/projects/ProjectForm'
import { LoadingSpinnerCentered } from '../../../components/ui/LoadingSpinner'
import { projectsService } from '../../../services/projects.service'
import type { Project } from '../../../types'

export const EditProjectPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Editar proyecto</h1>
        <p className="text-navy-600">{project.title}</p>
      </div>
      
      <ProjectForm project={project} onSuccess={() => navigate('/dashboard/projects')} />
    </div>
  )
}