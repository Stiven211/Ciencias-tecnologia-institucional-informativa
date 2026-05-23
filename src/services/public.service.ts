import { supabase } from '../lib/supabaseClient'
import type { Project } from '../types'

interface PublicProjectsFilters {
  search?: string
  technologies?: string[]
}

export const publicService = {
  async getFeaturedProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('status', 'published')
      .limit(3)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Project[]
  },

  async getPublicProjects(filters: PublicProjectsFilters = {}) {
    const query = supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('status', 'published')

    // Apply filters
    if (filters.search) {
      query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,technologies.cs.{${filters.search}}`)
    }

    if (filters.technologies && filters.technologies.length > 0) {
      // For PostgreSQL array contains
      query.contains('technologies', filters.technologies)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data as Project[]
  },

  async getPublicProjectBySlug(slug: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(full_name, avatar_url, specialization)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) throw error
    return data as Project
  },

  async getRelatedProjects(projectId: string, technologies: string[] = [], limit = 3) {
    const query = supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('status', 'published')
      .neq('id', projectId)
      .limit(limit)

    // If we have technologies, try to match by them
    if (technologies && technologies.length > 0) {
      // For simplicity, we'll get some projects and filter client-side for relatedness
      // In a production app, you'd want to do this more efficiently in the database
      const { data, error } = await query
      
      if (error) throw error
      
      // Simple client-side filtering for related projects (share at least one technology)
      if (data) {
        return data.filter(project => 
          project.technologies && 
          project.technologies.some((tech: string) => technologies.includes(tech))
        ).slice(0, limit)
      }
      
      return []
    }

    const { data, error } = await query

    if (error) throw error
    return data as Project[]
  },

  async getPublicStats() {
    const [projectsCount, professorsCount, resourcesCount, publicationsCount] = await Promise.all([
      supabase
        .from('projects')
        .select('id', { count: 'exact' })
        .eq('status', 'published'),
      
      supabase
        .from('profiles')
        .select('id', { count: 'exact' }),
      
      supabase
        .from('resources')
        .select('id', { count: 'exact' }),
      
      supabase
        .from('publications')
        .select('id', { count: 'exact' })
    ])

    if (projectsCount.error) throw projectsCount.error
    if (professorsCount.error) throw professorsCount.error
    if (resourcesCount.error) throw resourcesCount.error
    if (publicationsCount.error) throw publicationsCount.error

    return {
      projects: projectsCount.count,
      professors: professorsCount.count,
      resources: resourcesCount.count,
      publications: publicationsCount.count
    }
  }
}