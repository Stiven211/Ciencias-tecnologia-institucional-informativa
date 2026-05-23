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
    let query = supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `, { count: 'exact' })

    // Apply filters
    if (options?.professorId) {
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

    if (error) throw error
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
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single()

    if (error) throw error
    return data as Project
  },

  async updateProject(id: string, project: Partial<ProjectInsert>) {
    const { data, error } = await supabase
      .from('projects')
      .update(project)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Project
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async uploadCoverImage(file: File, projectId: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}-${Date.now()}.${fileExt}`
    const filePath = `covers/${fileName}`

    const { error } = await supabase.storage
      .from('projects')
      .upload(filePath, file, { upsert: true })

    if (error) throw error

    const { data: publicUrl } = supabase.storage
      .from('projects')
      .getPublicUrl(filePath)

    return publicUrl.publicUrl
  }
}