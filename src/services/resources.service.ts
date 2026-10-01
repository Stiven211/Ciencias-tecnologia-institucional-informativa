import { supabase } from '../lib/supabaseClient'
import type { Resource } from '../types'
import { restSelect, restCount, restInsert, restUpdate, restDelete } from '../utils/supabaseRest'

const PROFESSOR_FIELDS = 'full_name,avatar_url'

const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']

const requireResourceOwnership = async (
  resourceId: string,
  userId: string,
  isAdmin: boolean
): Promise<void> => {
  if (isAdmin) return

  const data = await restSelect<{ professor_id: string }>('resources', 'select=professor_id&id=eq.' + resourceId)

  const r = data[0]
  if (!r || r.professor_id !== userId) {
    throw new Error('No tienes permiso para modificar este recurso.')
  }
}

const validateResourceFile = (file: File, type: Resource['type']): void => {
  if (type === 'document') {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido para documento. Use PDF, DOC, DOCX o TXT.')
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new Error('El documento excede el tamano maximo permitido (20MB).')
    }
  } else if (type === 'image') {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido para imagen. Use JPG, PNG, WEBP o GIF.')
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('La imagen excede el tamano maximo permitido (5MB).')
    }
  } else if (type === 'video') {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido para video. Use MP4, WEBM o OGG.')
    }
    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error('El video excede el tamano maximo permitido (50MB).')
    }
  }
}

export const resourcesService = {
  async getResourceById(id: string): Promise<Resource> {
    const data = await restSelect<Resource>(
      'resources',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&id=eq.' + id + '&limit=1'
    )

    if (!data[0]) throw new Error('Recurso no encontrado')
    return data[0]
  },

  async getMyResources(userId: string): Promise<Resource[]> {
    return restSelect<Resource>(
      'resources',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&professor_id=eq.' + userId + '&order=created_at.desc'
    )
  },

  async getAllResources(): Promise<Resource[]> {
    return restSelect<Resource>(
      'resources',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&order=created_at.desc'
    )
  },

  async getResourcesByProfessor(professorId: string): Promise<Resource[]> {
    return restSelect<Resource>(
      'resources',
      'select=*&professor_id=eq.' + professorId + '&order=created_at.desc'
    )
  },

  async getRecentResources(limit = 5): Promise<Resource[]> {
    return restSelect<Resource>(
      'resources',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&order=created_at.desc&limit=' + limit
    )
  },

  async createResource(
    resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Resource> {
    const data = await restInsert<Resource>('resources', [resource])
    return data[0]
  },

  async updateResource(
    id: string,
    resource: Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at'>>,
    context: { userId: string; isAdmin: boolean }
  ): Promise<Resource> {
    await requireResourceOwnership(id, context.userId, context.isAdmin)

    const data = await restUpdate<Resource>('resources', resource, { id })
    return data[0]
  },

  async deleteResource(
    id: string,
    context: { userId: string; isAdmin: boolean }
  ): Promise<void> {
    await requireResourceOwnership(id, context.userId, context.isAdmin)
    await restDelete('resources', { id })
  },

  async uploadResourceFile(file: File, resourceId: string, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    if (!fileExt) {
      throw new Error('No se pudo determinar la extension del archivo.')
    }

    const type = file.type.startsWith('image/') ? 'image' as const
      : file.type.startsWith('video/') ? 'video' as const
      : 'document' as const

    validateResourceFile(file, type)

    const filePath = userId + '/' + resourceId + '-' + Date.now() + '.' + fileExt

    const { error } = await supabase.storage
      .from('resources')
      .upload(filePath, file)

    if (error) throw error

    const { data: publicUrl } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath)

    return publicUrl.publicUrl
  },

  async getRecentResourcesForDashboard(professorId: string, limit = 5): Promise<Resource[]> {
    return restSelect<Resource>(
      'resources',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&professor_id=eq.' + professorId +
        '&order=created_at.desc&limit=' + limit
    )
  },

  async getResourcesCountForDashboard(professorId: string): Promise<number> {
    return restCount('resources', { professor_id: 'eq.' + professorId })
  },
}
