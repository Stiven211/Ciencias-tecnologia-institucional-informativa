import { supabase } from '../lib/supabaseClient'
import type { Project, ProjectInsert } from '../types'

export const projectsService = {
  async getProjects(options?: { 
    limit?: number; 
    search?: string; 
    status?: string;
    professorId?: string;
    page?: number;
  }) {
    console.log('[projectsService] getProjects called with options:', options)
    let query = supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `, { count: 'exact' })

    // Apply filters
    if (options?.professorId) {
      console.log('[projectsService] Filtering by professorId:', options.professorId)
      query = query.eq('professor_id', options.professorId)
    }
    
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    
    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
    }

    // Apply pagination
    if (options?.limit !== undefined) {
      query = query.limit(options.limit)
    }
    
    // Apply page-based pagination (limit * page)
    if (options?.limit !== undefined && options?.page !== undefined && options?.page > 0) {
      const offset = (options.page - 1) * options.limit
      query = query.range(offset, offset + options.limit - 1)
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('[projectsService] getProjects error:', error)
      throw error
    }
    console.log('[projectsService] getProjects result count:', data?.length)
    return { data: data as Project[], count }
  },

  async getProjectById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Project
  },

  async getProjectsByProfessor(professorId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Project[]
  },

  async createProject(project: ProjectInsert) {
    console.log('[projectsService] createProject called with:', project)
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single()

    if (error) {
      console.error('[projectsService] createProject error:', error)
      throw error
    }
    console.log('[projectsService] createProject success, id:', data?.id)
    return data as Project
  },

  async updateProject(id: string, project: Partial<ProjectInsert>) {
    console.log('[projectsService] updateProject called for id:', id, 'data:', project)
    const { data, error } = await supabase
      .from('projects')
      .update(project)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[projectsService] updateProject error:', error)
      throw error
    }
    console.log('[projectsService] updateProject success, id:', data?.id)
    return data as Project
  },

  async deleteProject(id: string) {
    console.log('[projectsService] deleteProject called for id:', id)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[projectsService] deleteProject error:', error)
      throw error
    }
    console.log('[projectsService] deleteProject success, id:', id)
  },

  async uploadCoverImage(file: File, projectId: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}-${Date.now()}.${fileExt}`
    const filePath = `covers/${fileName}`

    console.log('[projectsService] Uploading cover image to bucket "covers":', filePath)
    const { error } = await supabase.storage
      .from('covers')
      .upload(filePath, file, { upsert: true })

    if (error) {
      console.error('[projectsService] Cover image upload error:', error)
      throw error
    }

    const { data: publicUrl } = supabase.storage
      .from('covers')
      .getPublicUrl(filePath)

    console.log('[projectsService] Cover image public URL:', publicUrl.publicUrl)
    return publicUrl.publicUrl
  },

  async uploadGalleryImage(file: File, projectId: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `gallery/${fileName}`

    console.log('[projectsService] Uploading gallery image to bucket "covers":', filePath)
    const { error } = await supabase.storage
      .from('covers')
      .upload(filePath, file)

    if (error) {
      console.error('[projectsService] Gallery image upload error:', error)
      throw error
    }

    const { data: publicUrl } = supabase.storage
      .from('covers')
      .getPublicUrl(filePath)

    console.log('[projectsService] Gallery image public URL:', publicUrl.publicUrl)
    return publicUrl.publicUrl
  }
}