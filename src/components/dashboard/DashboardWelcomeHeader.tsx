import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Plus } from 'lucide-react'

interface DashboardWelcomeHeaderProps {
  greeting: string
  date: string
}

export const DashboardWelcomeHeader = ({ greeting, date }: DashboardWelcomeHeaderProps) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const userName = user?.role === 'teacher' ? 'Profesor' : user?.fullName?.split(' ')[0]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">
          {greeting}, <span className="text-blue-500">{userName}</span>
        </h1>
        <p className="text-navy-500 text-sm mt-1">{date}</p>
      </div>
      <Button
        onClick={() => {
          console.log('[DashboardWelcomeHeader] Nuevo Proyecto clicked')
          navigate('/dashboard/projects/new')
        }}
        iconLeft={<Plus size={18} />}
      >
        Nuevo Proyecto
      </Button>
    </div>
  )
}
