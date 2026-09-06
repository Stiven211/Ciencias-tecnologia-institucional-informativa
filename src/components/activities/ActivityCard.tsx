import { Link } from 'react-router-dom'
import { Edit, Trash2, Calendar } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import type { Activity } from '../../types'

interface ActivityCardProps {
  activity: Activity
  onDelete: (activity: Activity) => void
}

export const ActivityCard = ({ activity, onDelete }: ActivityCardProps) => {
  const { user } = useAuthStore()
  const isOwner = user?.id === activity.professor_id
  const canEdit = isOwner || user?.role === 'admin'

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-navy-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-navy-900 line-clamp-1">
            {activity.title}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            activity.due_date && new Date(activity.due_date) < new Date()
              ? 'bg-red-100 text-red-800'
              : 'bg-navy-100 text-navy-800'
          }`}>
            {activity.due_date && new Date(activity.due_date) < new Date() ? 'Vencida' : 'Pendiente'}
          </span>
        </div>

        <p className="text-navy-600 text-sm mb-4 line-clamp-2">
          {activity.description || 'Sin descripción'}
        </p>

        <div className="flex items-center justify-between text-sm text-navy-500">
          <div className="flex items-center">
            <Calendar size={14} className="mr-1" />
            <span>
              {activity.due_date
                ? new Date(activity.due_date).toLocaleDateString('es-ES')
                : 'Sin fecha'}
            </span>
          </div>

          {canEdit && (
            <div className="flex items-center space-x-2">
              <Link
                to={`/dashboard/activities/${activity.id}/edit`}
                className="p-1.5 rounded-lg hover:bg-navy-100 text-navy-600"
              >
                <Edit size={16} />
              </Link>
              <button
                onClick={() => onDelete(activity)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
