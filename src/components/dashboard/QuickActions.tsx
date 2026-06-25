import { useNavigate } from 'react-router-dom'
import { BookPlus, FolderOpen, User, Shield } from 'lucide-react'
import { Card } from '../ui/Card'
import { useAuthStore } from '../../store/authStore'

const baseActions = [
  { name: 'Nuevo Proyecto', icon: BookPlus, color: 'bg-green-500', path: '/dashboard/projects/new' },
  { name: 'Mis Proyectos', icon: FolderOpen, color: 'bg-blue-500', path: '/dashboard/projects' },
  { name: 'Mi Perfil', icon: User, color: 'bg-navy-600', path: '/dashboard/profile' },
]

const adminOnlyAction = { name: 'Administración', icon: Shield, color: 'bg-red-500', path: '/dashboard/admin' }

export const QuickActions = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const actions = user?.role === 'admin' ? [...baseActions, adminOnlyAction] : baseActions

  return (
    <Card title="Accesos rápidos">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.name}
            onClick={() => {
              console.log('[QuickActions] clicked:', action.path)
              if (action.path) navigate(action.path)
            }}
            className="flex flex-col items-center p-4 rounded-xl border border-navy-200 hover:bg-navy-50 transition-colors"
          >
            <div className={`p-2 ${action.color} rounded-lg mb-2`}>
              <action.icon size={20} className="text-white" />
            </div>
            <span className="text-sm text-navy-700">{action.name}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}
