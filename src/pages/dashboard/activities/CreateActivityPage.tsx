import { useNavigate } from 'react-router-dom'
import { ActivityForm } from '../../../components/activities/ActivityForm'

export const CreateActivityPage = () => {
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Crear nueva actividad</h1>
        <p className="text-navy-600">Completa la información de la actividad académica</p>
      </div>
      
      <ActivityForm onSuccess={() => navigate('/dashboard/activities')} />
    </div>
  )
}
