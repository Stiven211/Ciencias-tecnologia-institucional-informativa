import { supabase } from '../lib/supabaseClient'
import type { Project, ProjectInsert } from '../types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const validateImage = (file: File, label: string): void => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido para ${label}. Use JPG, PNG, WEBP o GIF.`)
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`La imagen de ${label} excede el tamaño máximo permitido (5MB).`)
  }
}

const requireProjectOwnership = async (
  projectId: string,
  userId: string,
  isAdmin: boolean
): Promise<void> => {
  if (isAdmin) return

  const { data, error } = await supabase
    .from('projects')
    .select('professor_id')
    .eq('id', projectId)
    .single()

  if (error) throw error
  if (!data || data.professor_id !== userId) {
    throw new Error('No tienes permisos para modificar este proyecto.')
  }
}

export const projectsService = {
  async getProjects(options?: {
    limit?: number
    search?: string
    status?: string
    professorId?: string
    page?: number
  }) {
    let query = supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(id, full_name, avatar_url)
      `, { count: 'exact' })

    if (options?.professorId) {
      query = query.eq('professor_id', options.professorId)
    }

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
    }

    if (options?.limit !== undefined && options?.page !== undefined && options?.page > 0) {
      const offset = (options.page - 1) * options.limit
      query = query.range(offset, offset + options.limit - 1)
    } else if (options?.limit !== undefined) {
      query = query.limit(options.limit)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error
    return { data: (data ?? []) as Project[], count: count ?? 0 }
  },

  async getProjectById(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Project
  },

  async getProjectsByProfessor(professorId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        professor:profiles(id, full_name, avatar_url)
      `)
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Project[]
  },

  async createProject(project: ProjectInsert): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select('*')
      .single()

    if (error) throw error
    if (!data) {
      throw new Error('No se recibió respuesta del servidor al crear el proyecto.')
    }
    return data as Project
  },

  async updateProject(
    id: string,
    project: Partial<ProjectInsert>,
    context: { userId: string; isAdmin: boolean }
  ): Promise<Project> {
    await requireProjectOwnership(id, context.userId, context.isAdmin)

    const { data, error } = await supabase
      .from('projects')
      .update(project)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as Project
  },

  async deleteProject(
    id: string,
    context: { userId: string; isAdmin: boolean }
  ): Promise<void> {
    await requireProjectOwnership(id, context.userId, context.isAdmin)

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async uploadCoverImage(file: File, projectId: string, userId: string): Promise<string> {
    validateImage(file, 'portada')

    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error } = await supabase.storage
      .from('covers')
      .upload(filePath, file, { upsert: true })

    if (error) throw error

    const { data: publicUrl } = supabase.storage
      .from('covers')
      .getPublicUrl(filePath)

    return publicUrl.publicUrl
  },

  async uploadGalleryImage(file: File, projectId: string, userId: string): Promise<string> {
    validateImage(file, 'galería')

    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error } = await supabase.storage
      .from('gallery')
      .upload(filePath, file)

    if (error) throw error

    const { data: publicUrl } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath)

    return publicUrl.publicUrl
  }
}