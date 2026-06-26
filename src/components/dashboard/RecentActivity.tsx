import { BookOpen, FileText, Upload } from 'lucide-react'
import { Card } from '../ui/Card'

interface ActivityItem {
  id: string
  user: string
  action: string
  target: string
  time: string
  icon: React.ElementType
  type: 'project' | 'resource' | 'publication' | 'activity'
}

interface RecentActivityProps {
  recentProjects: any[]
  recentResources: any[]
  recentPublications: any[]
}

export const RecentActivity = ({ 
  recentProjects = [], 
  recentResources = [], 
  recentPublications = [] 
}: RecentActivityProps) => {
  // Convertir los datos reales en actividades de formato uniforme
  const activities: ActivityItem[] = []

  // Proyectos recientes
  recentProjects.forEach((project: any) => {
    activities.push({
      id: project.id,
      user: project.professor?.full_name || 'Profesor desconocido',
      action: project.status === 'published' ? 'publicó' : 'actualizó',
      target: project.title,
      time: new Date(project.created_at).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      icon: BookOpen,
      type: 'project'
    })
  })

  // Recursos recientes
  recentResources.forEach((resource: any) => {
    activities.push({
      id: resource.id,
      user: resource.professor?.full_name || 'Profesor desconocido',
      action: 'subió',
      target: resource.title,
      time: new Date(resource.created_at).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      icon: Upload,
      type: 'resource'
    })
  })

  // Publicaciones recientes
  recentPublications.forEach((pub: any) => {
    activities.push({
      id: pub.id,
      user: pub.professor?.full_name || 'Profesor desconocido',
      action: pub.published ? 'publicó' : 'actualizó',
      target: pub.title,
      time: new Date(pub.created_at).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      icon: FileText,
      type: 'publication'
    })
  })

  // Ordenar por fecha (más reciente primero)
  activities.sort((a, b) => 
    new Date(b.time).getTime() - new Date(a.time).getTime()
  )

  // Limitar a las 5 actividades más recientes
  const limitedActivities = activities.slice(0, 5)

  return (
    <Card title="Actividad reciente">
      {limitedActivities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-navy-500 text-sm">No hay actividad reciente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {limitedActivities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="p-2 bg-navy-100 rounded-lg">
                  <Icon size={16} className="text-navy-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy-900 truncate">
                    <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-navy-500">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}