import { useEffect, useState } from 'react'
import { publicService } from '../../services/public.service'

interface Stats {
  projects: number | null
  professors: number | null
  resources: number | null
  publications: number | null
}

export const PublicStats = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await publicService.getPublicStats()
        setStats(data)
      } catch (err) {
        console.error('Error loading stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((_) => (
        <div key={_} className="p-4 bg-navy-50 rounded-lg animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-content">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 0v4m0-4h4m-4-4H8" />
              </svg>
            </div>
            <div>
              <h3 className="text-navy-900 text-sm font-medium">0</h3>
              <p className="text-navy-500">Indicador</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  if (!stats) return <div className="p-6 text-navy-500">Error cargando estadísticas</div>

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div className="p-4 bg-navy-50 rounded-lg hover:bg-navy-100 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-content">
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 0v4m0-4h4m-4-4H8" />
            </svg>
          </div>
          <div>
            <h3 className="text-navy-900 text-sm font-medium">{stats.projects}</h3>
            <p className="text-navy-500">Proyectos publicados</p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-navy-50 rounded-lg hover:bg-navy-100 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-content">
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 0v4m0-4h4m-4-4H8" />
            </svg>
          </div>
          <div>
            <h3 className="text-navy-900 text-sm font-medium">{stats.professors}</h3>
            <p className="text-navy-500">Profesores activos</p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-navy-50 rounded-lg hover:bg-navy-100 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-content">
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 0v4m0-4h4m-4-4H8" />
            </svg>
          </div>
          <div>
            <h3 className="text-navy-900 text-sm font-medium">{stats.resources}</h3>
            <p className="text-navy-500">Recursos compartidos</p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-navy-50 rounded-lg hover:bg-navy-100 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-content">
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 0v4m0-4h4m-4-4H8" />
            </svg>
          </div>
          <div>
            <h3 className="text-navy-900 text-sm font-medium">{stats.publications}</h3>
            <p className="text-navy-500">Publicaciones</p>
          </div>
        </div>
      </div>
    </div>
  )
}