import { useEffect, useState } from 'react'
import { FolderOpen, Users, Share2, BookOpen } from 'lucide-react'
import { publicService } from '../../services/public.service'

interface Stats {
  projects: number | null
  professors: number | null
  resources: number | null
  publications: number | null
}

const statsConfig = [
  { key: 'projects', label: 'Proyectos', icon: FolderOpen, color: 'blue' },
  { key: 'professors', label: 'Profesores', icon: Users, color: 'indigo' },
  { key: 'resources', label: 'Recursos', icon: Share2, color: 'orange' },
  { key: 'publications', label: 'Publicaciones', icon: BookOpen, color: 'green' },
] as const

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
    <section className="py-12 bg-navy-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((_) => (
            <div key={_} className="bg-white rounded-xl p-6 border border-navy-200 animate-pulse">
              <div className="w-10 h-10 bg-navy-100 rounded-lg mb-3"></div>
              <div className="h-6 bg-navy-100 rounded mb-1"></div>
              <div className="h-3 bg-navy-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  if (!stats) return <div className="p-6 text-navy-500">Error cargando estadísticas</div>

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-500',
      indigo: 'bg-indigo-50 text-indigo-500',
      orange: 'bg-orange-50 text-orange-500',
      green: 'bg-green-50 text-green-500',
    }
    return colors[color as keyof typeof colors]
  }

  return (
    <section className="py-12 bg-navy-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statsConfig.map((config) => {
            const Icon = config.icon
            const value = stats[config.key as keyof Stats]
            return (
              <div key={config.key} className="bg-white rounded-xl p-6 border border-navy-200 hover:shadow-md transition-all duration-200">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${getColorClasses(config.color)}`}>
                  <Icon size={20} />
                </div>
                <div className="text-2xl font-bold text-navy-900">{value ?? 0}</div>
                <div className="text-sm text-navy-600">{config.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}