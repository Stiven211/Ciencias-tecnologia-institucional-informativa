import { supabase } from '../lib/supabaseClient'
import type { Project, Publication } from '../types'

interface PublicProjectsFilters {
  search?: string
  technologies?: string[]
  categories?: string[]
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
      query.contains('technologies', filters.technologies)
    }

    if (filters.categories && filters.categories.length > 0) {
      query.overlaps('categories', filters.categories)
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

  async getPublishedProjectsByProfessor(professorId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(id, full_name, avatar_url)
      `)
      .eq('professor_id', professorId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Project[]
  },

  async getPublishedPublications() {
    const { data, error } = await supabase
      .from('publications')
      .select(`
        *,
        professor:profiles(id, full_name, avatar_url)
      `)
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Publication[]
  },

  async getPublishedPublicationById(id: string) {
    const { data, error } = await supabase
      .from('publications')
      .select(`
        *,
        professor:profiles(id, full_name, avatar_url)
      `)
      .eq('id', id)
      .eq('published', true)
      .single()

    if (error) throw error
    return data as Publication
  }
}