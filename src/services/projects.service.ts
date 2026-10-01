import { supabase } from '../lib/supabaseClient'
import type { Project, ProjectInsert } from '../types'
import { restSelect, restCount, restInsert, restUpdate, restDelete } from '../utils/supabaseRest'

const PROFILE_FIELDS = 'id,full_name,avatar_url'

interface ProjectsFilterOptions {
  search?: string
  status?: string
  professorId?: string
}

const buildProjectsFilters = (options?: ProjectsFilterOptions): Record<string, string> => {
  const filters: Record<string, string> = {}
  if (options?.professorId) filters.professor_id = 'eq.' + options.professorId
  if (options?.status) filters.status = 'eq.' + options.status
  if (options?.search) {
    const term = options.search.replace(/[,()]/g, ' ')
    filters.or = '(title.ilike.*' + term + '*,description.ilike.*' + term + '*)'
  }
  return filters
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const validateImage = (file: File, label: string): void => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido para ' + label + '. Use JPG, PNG, WEBP o GIF.')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen de ' + label + ' excede el tamano maximo permitido (5MB).')
  }
}

const requireProjectOwnership = async (
  projectId: string,
  userId: string,
  isAdmin: boolean
): Promise<void> => {
  if (isAdmin) return

  const data = await restSelect<{ professor_id: string }>('projects', 'select=professor_id&id=eq.' + projectId)

  const proj = data[0]
  if (!proj || proj.professor_id !== userId) {
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
    const params: string[] = ['select=*,professor:profiles(' + PROFILE_FIELDS + ')']

    if (options?.professorId) {
      params.push('professor_id=eq.' + options.professorId)
    }

    if (options?.status) {
      params.push('status=eq.' + options.status)
    }

    if (options?.search) {
      const term = options.search.replace(/[,()]/g, ' ')
      params.push('or=(title.ilike.*' + term + '*,description.ilike.*' + term + '*)')
    }

    if (options?.limit !== undefined && options?.page !== undefined && options.page > 0) {
      params.push('offset=' + ((options.page - 1) * options.limit))
      params.push('limit=' + options.limit)
    } else if (options?.limit !== undefined) {
      params.push('limit=' + options.limit)
    }

    params.push('order=created_at.desc')

    const data = await restSelect<Project>('projects', params.join('&'))
    const count = await restCount('projects', buildProjectsFilters(options))
    return { data, count }
  },

  async getProjectById(id: string): Promise<Project> {
    const data = await restSelect<Project>(
      'projects',
      'select=*,professor:profiles(' + PROFILE_FIELDS + ')&id=eq.' + id + '&limit=1'
    )

    if (!data[0]) throw new Error('Proyecto no encontrado')
    return data[0]
  },

  async getProjectsByProfessor(professorId: string): Promise<Project[]> {
    return restSelect<Project>(
      'projects',
      'select=*,professor:profiles(' + PROFILE_FIELDS + ')&professor_id=eq.' + professorId + '&order=created_at.desc'
    )
  },

  async createProject(project: ProjectInsert): Promise<Project> {
    const data = await restInsert<Project>('projects', [project])
    return data[0]
  },

  async updateProject(
    id: string,
    project: Partial<ProjectInsert>,
    context: { userId: string; isAdmin: boolean }
  ): Promise<Project> {
    await requireProjectOwnership(id, context.userId, context.isAdmin)

    const data = await restUpdate<Project>('projects', project, { id })
    return data[0]
  },

  async deleteProject(
    id: string,
    context: { userId: string; isAdmin: boolean }
  ): Promise<void> {
    await requireProjectOwnership(id, context.userId, context.isAdmin)
    await restDelete('projects', { id })
  },

  async uploadCoverImage(file: File, projectId: string, userId: string): Promise<string> {
    validateImage(file, 'portada')

    const fileExt = file.name.split('.').pop()
    const fileName = projectId + '-' + Date.now() + '.' + fileExt
    const filePath = userId + '/' + fileName

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
    validateImage(file, 'galeria')

    const fileExt = file.name.split('.').pop()
    const fileName = projectId + '-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + fileExt
    const filePath = userId + '/' + fileName

    const { error } = await supabase.storage
      .from('gallery')
      .upload(filePath, file)

    if (error) throw error

    const { data: publicUrl } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath)

    return publicUrl.publicUrl
  },

  async getRecentProjectsForDashboard(professorId: string, limit = 5): Promise<Project[]> {
    return restSelect<Project>(
      'projects',
      'select=*,professor:profiles(' + PROFILE_FIELDS + ')&professor_id=eq.' + professorId +
        '&order=created_at.desc&limit=' + limit
    )
  },

  async getProjectCountsForDashboard(professorId: string): Promise<{ total: number; published: number; drafts: number }> {
    const base = { professor_id: 'eq.' + professorId }
    const [total, published, drafts] = await Promise.all([
      restCount('projects', base),
      restCount('projects', { ...base, status: 'eq.published' }),
      restCount('projects', { ...base, status: 'eq.draft' }),
    ])
    return { total, published, drafts }
  },
}
