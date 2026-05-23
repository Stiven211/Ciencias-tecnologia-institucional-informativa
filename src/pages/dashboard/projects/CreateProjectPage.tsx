import { useNavigate } from 'react-router-dom'
import { ProjectForm } from '../../../components/projects/ProjectForm'

export const CreateProjectPage = () => {
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Crear nuevo proyecto</h1>
        <p className="text-navy-600">Completa la información de tu proyecto académico</p>
      </div>
      
      <ProjectForm onSuccess={() => navigate('/dashboard/projects')} />
    </div>
  )
}