import { supabase } from '../lib/supabaseClient'
import type { Resource } from '../types'

const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024 // 20MB
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50MB

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

  const { data, error } = await supabase
    .from('resources')
    .select('professor_id')
    .eq('id', resourceId)
    .single()

  if (error) throw error
  if (!data || data.professor_id !== userId) {
    throw new Error('No tienes permiso para modificar este recurso.')
  }
}

const validateResourceFile = (file: File, type: Resource['type']): void => {
  if (type === 'document') {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido para documento. Use PDF, DOC, DOCX o TXT.')
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new Error('El documento excede el tamaño máximo permitido (20MB).')
    }
  } else if (type === 'image') {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido para imagen. Use JPG, PNG, WEBP o GIF.')
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('La imagen excede el tamaño máximo permitido (5MB).')
    }
  } else if (type === 'video') {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido para video. Use MP4, WEBM o OGG.')
    }
    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error('El video excede el tamaño máximo permitido (50MB).')
    }
  }
}

export const resourcesService = {
  async getResourceById(id: string): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Resource
  },

  async getMyResources(userId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('professor_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Resource[]
  },

  async getAllResources(): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Resource[]
  },

  async getResourcesByProfessor(professorId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Resource[]
  },

  async getRecentResources(limit = 5): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as Resource[]
  },

  async createResource(
    resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .insert([resource])
      .select()
      .single()

    if (error) throw error
    return data as Resource
  },

  async updateResource(
    id: string,
    resource: Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at'>>,
    context: { userId: string; isAdmin: boolean }
  ): Promise<Resource> {
    await requireResourceOwnership(id, context.userId, context.isAdmin)

    const { data, error } = await supabase
      .from('resources')
      .update(resource)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Resource
  },

  async deleteResource(
    id: string,
    context: { userId: string; isAdmin: boolean }
  ): Promise<void> {
    await requireResourceOwnership(id, context.userId, context.isAdmin)

    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async uploadResourceFile(file: File, resourceId: string, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    if (!fileExt) {
      throw new Error('No se pudo determinar la extensión del archivo.')
    }

    const type = file.type.startsWith('image/') ? 'image' as const
      : file.type.startsWith('video/') ? 'video' as const
      : 'document' as const

    validateResourceFile(file, type)

    const filePath = `${userId}/${resourceId}-${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('resources')
      .upload(filePath, file)

    if (error) throw error

    const { data: publicUrl } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath)

    return publicUrl.publicUrl
  },
}
