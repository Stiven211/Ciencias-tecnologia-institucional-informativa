import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../store/authStore'

interface DashboardStats {
  projects: number
  resources: number
  collaborators: number
  views: string
}

export const useDashboardStats = () => {
  const { user } = useAuthStore()
  
  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    resources: 0,
    collaborators: 0,
    views: '0'
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Obtener estadísticas reales del profesor actual
        const [
          projectsCount,
          resourcesCount,
          profilesCount,
          viewsCount
        ] = await Promise.all([
          // Proyectos del profesor actual
          supabase
            .from('projects')
            .select('id', { count: 'exact' })
            .eq('professor_id', user.id),
            
          // Recursos del profesor actual
          supabase
            .from('resources')
            .select('id', { count: 'exact' })
            .eq('professor_id', user.id),
            
          // Contar colaboradores (otros profesores)
          supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('role', 'teacher')
            .neq('id', user.id),
            
          // Para las visualizaciones, vamos a usar un placeholder o podemos calcularlo de otra manera
          // Por ahora, vamos a usar un valor estático o podemos agregar una tabla de analytics
          supabase
            .from('projects')
            .select('id')
            .eq('professor_id', user.id)
        ])
        
        if (projectsCount.error) throw projectsCount.error
        if (resourcesCount.error) throw resourcesCount.error
        if (profilesCount.error) throw profilesCount.error
        if (viewsCount.error) throw viewsCount.error
        
        setStats({
          projects: projectsCount.count ?? 0,
          resources: resourcesCount.count ?? 0,
          collaborators: profilesCount.count ?? 0,
          views: `${Math.floor((projectsCount.count ?? 0) * 150)}k` // Estimación básica
        })
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [user?.id])

  return { stats, loading, error }
}