import { AlertTriangle } from 'lucide-react'
import { DashboardWelcomeHeader } from '../../components/dashboard/DashboardWelcomeHeader'
import { DashboardStatsGrid } from '../../components/dashboard/DashboardStatsGrid'
import { DashboardContentPanel } from '../../components/dashboard/DashboardContentPanel'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { useDashboardData } from '../../hooks/useDashboardData'

export const DashboardHome = () => {
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

  if (statsLoading || dataLoading) {
    return (
      <div className="space-y-6">
        <DashboardWelcomeHeader greeting={getGreeting()} date={formatDate()} />
        <DashboardStatsGrid loading />
        <DashboardContentPanel 
          recentProjects={[]} 
          recentResources={[]} 
          recentPublications={[]} 
        />
      </div>
    )
  }

  if (statsError || dataError) {
    return (
      <div className="space-y-6">
        <DashboardWelcomeHeader greeting={getGreeting()} date={formatDate()} />
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <AlertTriangle size={20} className="mr-3" />
          <div>
            <h3 className="font-bold">Error al cargar el dashboard</h3>
            <p className="mt-1">
              {(statsError || dataError) ?? 'Ocurrió un error inesperado'}
            </p>
          </div>
        </div>
        <DashboardStatsGrid stats={stats} />
        <DashboardContentPanel 
          recentProjects={data?.recentProjects ?? []} 
          recentResources={data?.recentResources ?? []} 
          recentPublications={data?.recentPublications ?? []} 
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardWelcomeHeader greeting={getGreeting()} date={formatDate()} />
      <DashboardStatsGrid stats={stats} />
      <DashboardContentPanel 
        recentProjects={data?.recentProjects ?? []} 
        recentResources={data?.recentResources ?? []} 
        recentPublications={data?.recentPublications ?? []} 
      />
    </div>
  )
}
