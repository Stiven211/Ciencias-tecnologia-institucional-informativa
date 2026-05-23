import { useState, useEffect } from 'react'
import { Calendar, Loader2, AlertTriangle } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { useAuthStore } from '../../store/authStore'
import { activitiesService } from '../../services/activities.service'

interface Task {
  id: string
  title: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'completed'
}

const priorityVariants = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
} as const

export const UpcomingTasks = () => {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchTasks = async () => {
      try {
        setLoading(true)
        const activities = await activitiesService.getUpcomingTasks(5)
        
        // Convertir actividades a tareas para el dashboard
        const taskList: Task[] = activities.map((activity: any) => ({
          id: activity.id,
          title: activity.title,
          dueDate: new Date(activity.due_date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
          }),
          priority: activity.priority as 'high' | 'medium' | 'low' || 'medium',
          status: activity.status as 'pending' | 'completed' || 'pending'
        }))
        
        setTasks(taskList)
      } catch (err) {
        console.error('Error fetching upcoming tasks:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar tareas próximas')
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [user?.id])

  if (loading) {
    return (
      <Card title="Próximas tareas">
        <div className="h-32 flex items-center justify-center text-navy-400">
          <Loader2 size={24} className="mr-3" />
          Cargando tareas próximas...
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card title="Próximas tareas">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <AlertTriangle size={20} className="mr-3" />
          <div>
            <h3 className="font-bold">Error al cargar tareas</h3>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card title="Próximas tareas">
        <div className="text-center py-8">
          <p className="text-navy-500">No hay tareas próximas</p>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Próximas tareas">
      <div className="space-y-3">
        {tasks.map((task: Task) => (
          <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-navy-200">
            <div className="flex-1">
              <p className="font-medium text-navy-900">{task.title}</p>
              <div className="flex items-center text-navy-500 text-sm mt-1">
                <Calendar size={14} className="mr-1" />
                <span>{task.dueDate}</span>
              </div>
            </div>
            <Badge variant={priorityVariants[task.priority as keyof typeof priorityVariants]}>
              {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}