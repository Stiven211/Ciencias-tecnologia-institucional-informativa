import { supabase } from '../lib/supabaseClient'
import type { Publication } from '../types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024 // 20MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const requirePublicationOwnership = async (
  publicationId: string,
  userId: string,
  isAdmin: boolean
): Promise<void> => {
  if (isAdmin) return

  const { data, error } = await supabase
    .from('publications')
    .select('professor_id')
    .eq('id', publicationId)
    .single()

  if (error) throw error
  if (!data || data.professor_id !== userId) {
    throw new Error('No tienes permiso para modificar esta publicación.')
  }
}

const validatePublicationFile = (file: File): void => {
  const isImage = file.type.startsWith('image/')
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type)

  if (!isImage && !isDocument) {
    throw new Error('Tipo de archivo no permitido. Use JPG, PNG, WEBP, GIF, PDF, DOC, DOCX o TXT.')
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen excede el tamaño máximo permitido (5MB).')
  }

  if (isDocument && file.size > MAX_DOCUMENT_BYTES) {
    throw new Error('El documento excede el tamaño máximo permitido (20MB).')
  }
}

export const publicationsService = {
  async getPublicationById(id: string): Promise<Publication> {
    const { data, error } = await supabase
      .from('publications')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Publication
  },

  async getMyPublications(userId: string): Promise<Publication[]> {
    const { data, error } = await supabase
      .from('publications')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('professor_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Publication[]
  },

  async getAllPublications(): Promise<Publication[]> {
    const { data, error } = await supabase
      .from('publications')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Publication[]
  },

  async getPublicationsByProfessor(professorId: string): Promise<Publication[]> {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Publication[]
  },

  async getRecentPublications(limit = 5): Promise<Publication[]> {
    const { data, error } = await supabase
      .from('publications')
      .select(`
        *,
        professor:profiles(full_name, avatar_url)
      `)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as Publication[]
  },

  async createPublication(
    publication: Omit<Publication, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Publication> {
    const { data, error } = await supabase
      .from('publications')
      .insert([publication])
      .select()
      .single()

    if (error) throw error
    return data as Publication
  },

  async updatePublication(
    id: string,
    publication: Partial<Omit<Publication, 'id' | 'created_at' | 'updated_at'>>,
    context: { userId: string; isAdmin: boolean }
  ): Promise<Publication> {
    await requirePublicationOwnership(id, context.userId, context.isAdmin)

    const { data, error } = await supabase
      .from('publications')
      .update(publication)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Publication
  },

  async deletePublication(
    id: string,
    context: { userId: string; isAdmin: boolean }
  ): Promise<void> {
    await requirePublicationOwnership(id, context.userId, context.isAdmin)

    const { error } = await supabase
      .from('publications')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async uploadPublicationFile(file: File, publicationId: string, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    if (!fileExt) {
      throw new Error('No se pudo determinar la extensión del archivo.')
    }

    validatePublicationFile(file)

    const filePath = `${userId}/${publicationId}-${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('publications')
      .upload(filePath, file)

    if (error) throw error

    const { data: publicUrl } = supabase.storage
      .from('publications')
      .getPublicUrl(filePath)

    return publicUrl.publicUrl
  },
}