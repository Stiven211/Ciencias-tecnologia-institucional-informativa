import { Plus, FolderOpen, BookOpen, Users, Loader2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { StatsCard } from '../../components/dashboard/StatsCard'
import { QuickActions } from '../../components/dashboard/QuickActions'
import { RecentActivity } from '../../components/dashboard/RecentActivity'
import { UpcomingTasks } from '../../components/dashboard/UpcomingTasks'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { useDashboardData } from '../../hooks/useDashboardData'

export const DashboardHome = () => {
  const { user } = useAuthStore()
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats()
  const { data, loading: dataLoading, error: dataError } = useDashboardData()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Mostrar estados de carga y error
  if (statsLoading || dataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy-900">
              {getGreeting()}, {user?.role === 'teacher' ? 'Profesor' : user?.fullName?.split(' ')[0]}
            </h1>
            <p className="text-navy-600 mt-1">{formatDate()}</p>
          </div>
          <button
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            <Plus size={20} className="mr-2" />
            Nuevo Proyecto
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((_, index) => (
            <StatsCard 
              key={index}
              title="Cargando..."
              value="--"
              icon={Loader2}
              className="animate-pulse"
            />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 flex items-center justify-center text-navy-400">
              Cargando actividad reciente...
            </div>
            <div className="h-64 flex items-center justify-center text-navy-400">
              Cargando tareas próximas...
            </div>
          </div>
          <div className="space-y-6">
            <QuickActions />
          </div>
        </div>
      </div>
    )
  }

  if (statsError || dataError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy-900">
              {getGreeting()}, {user?.role === 'teacher' ? 'Profesor' : user?.fullName?.split(' ')[0]}
            </h1>
            <p className="text-navy-600 mt-1">{formatDate()}</p>
          </div>
          <button
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            <Plus size={20} className="mr-2" />
            Nuevo Proyecto
          </button>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <AlertTriangle size={20} className="mr-3" />
          <div>
            <h3 className="font-bold">Error al cargar el dashboard</h3>
            <p className="mt-1">
              {(statsError || dataError) ?? 'Ocurrió un error inesperado'}
            </p>
          </div>
        </div>
        
        {/* Mostrar el contenido con los datos disponibles o valores por defecto */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              title: 'Mis Proyectos', 
              value: stats?.projects ?? 0, 
              icon: BookOpen, 
              trend: { value: 2, positive: true }, 
              description: 'activos este semestre' 
            },
            { 
              title: 'Recursos', 
              value: stats?.resources ?? 0, 
              icon: FolderOpen, 
              trend: { value: 5, positive: true }, 
              description: 'compartidos con estudiantes' 
            },
            { 
              title: 'Colaboradores', 
              value: stats?.collaborators ?? 0, 
              icon: Users, 
              trend: { value: 1, positive: true }, 
              description: 'con otros profesores' 
            },
            { 
              title: 'Visualizaciones', 
              value: stats?.views ?? '0k', 
              icon: Users, 
              trend: { value: 15, positive: true }, 
              description: 'este mes' 
            }
          ].map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentActivity 
              recentProjects={data?.recentProjects ?? []} 
              recentResources={data?.recentResources ?? []} 
              recentPublications={data?.recentPublications ?? []} 
            />
            <UpcomingTasks />
          </div>
          <div className="space-y-6">
            <QuickActions />
          </div>
        </div>
      </div>
    )
  }

  // Estado normal con datos
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">
            {getGreeting()}, {user?.role === 'teacher' ? 'Profesor' : user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-navy-600 mt-1">{formatDate()}</p>
        </div>
        <button
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
        >
          <Plus size={20} className="mr-2" />
          Nuevo Proyecto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'Mis Proyectos', 
            value: stats.projects, 
            icon: BookOpen, 
            trend: { value: 2, positive: true }, 
            description: 'activos este semestre' 
          },
          { 
            title: 'Recursos', 
            value: stats.resources, 
            icon: FolderOpen, 
            trend: { value: 5, positive: true }, 
            description: 'compartidos con estudiantes' 
          },
          { 
            title: 'Colaboradores', 
            value: stats.collaborators, 
            icon: Users, 
            trend: { value: 1, positive: true }, 
            description: 'con otros profesores' 
          },
          { 
            title: 'Visualizaciones', 
            value: stats.views, 
            icon: Users, 
            trend: { value: 15, positive: true }, 
            description: 'este mes' 
          }
        ].map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity 
            recentProjects={data?.recentProjects ?? []} 
            recentResources={data?.recentResources ?? []} 
            recentPublications={data?.recentPublications ?? []} 
          />
          <UpcomingTasks />
        </div>
        <div className="space-y-6">
          <QuickActions />
        </div>
      </div>
    </div>
  )
}