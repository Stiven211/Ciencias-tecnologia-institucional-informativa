import { useNavigate } from 'react-router-dom'
import { ResourceForm } from '../../../components/resources/ResourceForm'

export const CreateResourcePage = () => {
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Crear nuevo recurso</h1>
        <p className="text-navy-600">Completa la información de tu recurso académico</p>
      </div>
      
      <ResourceForm onSuccess={() => navigate('/dashboard/resources')} />
    </div>
  )
}
