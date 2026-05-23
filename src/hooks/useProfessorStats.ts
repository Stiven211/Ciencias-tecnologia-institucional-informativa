import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../store/authStore'

export const useProfessorStats = () => {
  const { user } = useAuthStore()
  
  const [stats, setStats] = useState({
    projects: 0,
    published: 0,
    drafts: 0,
    resources: 0,
    publications: 0,
    activities: 0
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
          projectsResult,
          resourcesResult,
          publicationsResult,
          activitiesResult
        ] = await Promise.all([
          // Total de proyectos
          supabase
            .from('projects')
            .select('id', { count: 'exact' })
            .eq('professor_id', user.id),
            
          // Proyectos publicados
          supabase
            .from('projects')
            .select('id', { count: 'exact' })
            .eq('professor_id', user.id)
            .eq('status', 'published'),
            
          // Proyectos en borrador
          supabase
            .from('projects')
            .select('id', { count: 'exact' })
            .eq('professor_id', user.id)
            .eq('status', 'draft'),
            
          // Recursos
          supabase
            .from('resources')
            .select('id', { count: 'exact' })
            .eq('professor_id', user.id),
            
          // Publicaciones
          supabase
            .from('publications')
            .select('id', { count: 'exact' })
            .eq('professor_id', user.id),
            
          // Actividades
          supabase
            .from('activities')
            .select('id', { count: 'exact' })
            .eq('professor_id', user.id)
        ])
        
        if (projectsResult.error) throw projectsResult.error
        if (resourcesResult.error) throw resourcesResult.error
        if (publicationsResult.error) throw publicationsResult.error
        if (activitiesResult.error) throw activitiesResult.error
        
        setStats({
          projects: projectsResult.count ?? 0,
          published: resourcesResult.count ?? 0,
          drafts: activitiesResult.count ?? 0,
          resources: resourcesResult.count ?? 0,
          publications: publicationsResult.count ?? 0,
          activities: activitiesResult.count ?? 0
        })
      } catch (err) {
        console.error('Error fetching professor stats:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [user?.id])

  return { stats, loading, error }
}