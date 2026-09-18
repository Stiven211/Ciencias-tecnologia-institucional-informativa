import { AlertTriangle } from 'lucide-react'
import { DashboardWelcomeHeader } from '../../components/dashboard/DashboardWelcomeHeader'
import { DashboardStatsGrid } from '../../components/dashboard/DashboardStatsGrid'
import { DashboardContentPanel } from '../../components/dashboard/DashboardContentPanel'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { useDashboardData } from '../../hooks/useDashboardData'

export const DashboardHome = () => {
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats()
  const { data, error: dataError, refetch: refetchData } = useDashboardData()

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

  return (
    <div className="space-y-6">
      <DashboardWelcomeHeader greeting={getGreeting()} date={formatDate()} />
      {statsError || dataError ? (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-4 mb-6" role="status">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold">Datos parcialmente disponibles</h3>
              <p className="mt-1">El dashboard está disponible; algunos datos aún no respondieron.</p>
              <button
                onClick={() => {
                  refetchStats()
                  refetchData()
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <DashboardStatsGrid loading={statsLoading} stats={statsLoading ? undefined : stats} />
      <DashboardContentPanel 
        recentProjects={data?.recentProjects ?? []} 
        recentResources={data?.recentResources ?? []} 
        recentPublications={data?.recentPublications ?? []} 
      />
    </div>
  )
}
