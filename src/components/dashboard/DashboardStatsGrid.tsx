import { BookOpen, FolderOpen, Users, Loader2 } from 'lucide-react'
import { StatsCard } from './StatsCard'

interface DashboardStatsGridProps {
  stats?: {
    projects: number
    resources: number
    collaborators: number
    views: number | string
  }
  loading?: boolean
}

const fallbackStats = [
  {
    title: 'Mis Proyectos',
    value: 0,
    icon: BookOpen,
    trend: { value: 2, positive: true },
    description: 'activos este semestre',
  },
  {
    title: 'Recursos',
    value: 0,
    icon: FolderOpen,
    trend: { value: 5, positive: true },
    description: 'compartidos con estudiantes',
  },
  {
    title: 'Colaboradores',
    value: 0,
    icon: Users,
    trend: { value: 1, positive: true },
    description: 'con otros profesores',
  },
  {
    title: 'Visualizaciones',
    value: '0k',
    icon: Users,
    trend: { value: 15, positive: true },
    description: 'este mes',
  },
]

export const DashboardStatsGrid = ({ stats, loading }: DashboardStatsGridProps) => {
  if (loading) {
    return (
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
    )
  }

  const statsToRender = stats
    ? [
        {
          title: 'Mis Proyectos',
          value: stats.projects,
          icon: BookOpen,
          trend: { value: 2, positive: true },
          description: 'activos este semestre',
        },
        {
          title: 'Recursos',
          value: stats.resources,
          icon: FolderOpen,
          trend: { value: 5, positive: true },
          description: 'compartidos con estudiantes',
        },
        {
          title: 'Colaboradores',
          value: stats.collaborators,
          icon: Users,
          trend: { value: 1, positive: true },
          description: 'con otros profesores',
        },
        {
          title: 'Visualizaciones',
          value: stats.views,
          icon: Users,
          trend: { value: 15, positive: true },
          description: 'este mes',
        },
      ]
    : fallbackStats

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsToRender.map((stat) => (
        <StatsCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}
