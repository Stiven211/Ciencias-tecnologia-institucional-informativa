import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Project, Resource, Publication } from '../types'
import { useAuthStore } from '../store/authStore'

interface DashboardData {
  recentProjects: Project[]
  recentResources: Resource[]
  recentPublications: Publication[]
}

export const useDashboardData = () => {
  const { user } = useAuthStore()
  
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Obtener datos reales para el dashboard
        const [
          projectsResult,
          resourcesResult,
          publicationsResult
        ] = await Promise.all([
          // Proyectos recientes del profesor
          supabase
            .from('projects')
            .select(`
              *,
              professor:profiles(full_name, avatar_url)
            `)
            .eq('professor_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
            
          // Recursos recientes del profesor
          supabase
            .from('resources')
            .select(`
              *,
              professor:profiles(full_name, avatar_url)
            `)
            .eq('professor_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
            
          // Publicaciones recientes del profesor
          supabase
            .from('publications')
            .select(`
              *,
              professor:profiles(full_name, avatar_url)
            `)
            .eq('professor_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)
        ])
        
        if (projectsResult.error) throw projectsResult.error
        if (resourcesResult.error) throw resourcesResult.error
        if (publicationsResult.error) throw publicationsResult.error
        
        setData({
          recentProjects: projectsResult.data,
          recentResources: resourcesResult.data,
          recentPublications: publicationsResult.data
        })
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar datos del dashboard')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user?.id])

  return { data, loading, error }
}