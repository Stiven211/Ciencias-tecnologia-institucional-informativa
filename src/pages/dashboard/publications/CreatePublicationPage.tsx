import { useNavigate } from 'react-router-dom'
import { PublicationForm } from '../../../components/publications/PublicationForm'

export const CreatePublicationPage = () => {
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Crear nueva publicación</h1>
        <p className="text-navy-600">Completa la información de tu publicación académica</p>
      </div>
      
      <PublicationForm onSuccess={() => navigate('/dashboard/publications')} />
    </div>
  )
}
