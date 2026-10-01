import { supabase } from '../lib/supabaseClient'
import type { Publication } from '../types'
import { restSelect, restInsert, restUpdate, restDelete, restCount } from '../utils/supabaseRest'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const PROFESSOR_FIELDS = 'full_name,avatar_url'

const requirePublicationOwnership = async (
  publicationId: string,
  userId: string,
  isAdmin: boolean
): Promise<void> => {
  if (isAdmin) return

  const data = await restSelect<Publication>(
    'publications',
    'select=professor_id&id=eq.' + publicationId,
  )

  const pub = data[0]
  if (!pub || pub.professor_id !== userId) {
    throw new Error('No tienes permiso para modificar esta publicacion.')
  }
}

const validatePublicationFile = (file: File): void => {
  const isImage = file.type.startsWith('image/')
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type)

  if (!isImage && !isDocument) {
    throw new Error('Tipo de archivo no permitido. Use JPG, PNG, WEBP, GIF, PDF, DOC, DOCX o TXT.')
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen excede el tamano maximo permitido (5MB).')
  }

  if (isDocument && file.size > MAX_DOCUMENT_BYTES) {
    throw new Error('El documento excede el tamano maximo permitido (20MB).')
  }
}

export const publicationsService = {
  async getPublicationById(id: string): Promise<Publication> {
    const data = await restSelect<Publication>(
      'publications',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&id=eq.' + id + '&limit=1'
    )

    if (!data[0]) throw new Error('Publicacion no encontrada')
    return data[0]
  },

  async getMyPublications(userId: string): Promise<Publication[]> {
    return restSelect<Publication>(
      'publications',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&professor_id=eq.' + userId + '&order=created_at.desc'
    )
  },

  async getAllPublications(): Promise<Publication[]> {
    return restSelect<Publication>(
      'publications',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&order=created_at.desc'
    )
  },

  async getPublicationsByProfessor(professorId: string): Promise<Publication[]> {
    return restSelect<Publication>(
      'publications',
      'select=*&professor_id=eq.' + professorId + '&order=created_at.desc'
    )
  },

  async getRecentPublications(limit = 5): Promise<Publication[]> {
    return restSelect<Publication>(
      'publications',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&published=eq.true&order=published_at.desc&limit=' + limit
    )
  },

  async createPublication(
    publication: Omit<Publication, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Publication> {
    const data = await restInsert<Publication>('publications', [publication])
    return data[0]
  },

  async updatePublication(
    id: string,
    publication: Partial<Omit<Publication, 'id' | 'created_at' | 'updated_at'>>,
    context: { userId: string; isAdmin: boolean }
  ): Promise<Publication> {
    await requirePublicationOwnership(id, context.userId, context.isAdmin)

    const data = await restUpdate<Publication>('publications', publication, { id })
    return data[0]
  },

  async deletePublication(
    id: string,
    context: { userId: string; isAdmin: boolean }
  ): Promise<void> {
    await requirePublicationOwnership(id, context.userId, context.isAdmin)
    await restDelete('publications', { id })
  },

  async uploadPublicationFile(file: File, publicationId: string, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    if (!fileExt) {
      throw new Error('No se pudo determinar la extension del archivo.')
    }

    validatePublicationFile(file)

    const filePath = userId + '/' + publicationId + '-' + Date.now() + '.' + fileExt

    const { error } = await supabase.storage
      .from('publications')
      .upload(filePath, file)

    if (error) throw error

    const { data: publicUrl } = supabase.storage
      .from('publications')
      .getPublicUrl(filePath)

    return publicUrl.publicUrl
  },

  async getRecentPublicationsForDashboard(professorId: string, limit = 5): Promise<Publication[]> {
    return restSelect<Publication>(
      'publications',
      'select=*,professor:profiles(' + PROFESSOR_FIELDS + ')&professor_id=eq.' + professorId +
        '&order=created_at.desc&limit=' + limit
    )
  },

  async getPublicationsCountForDashboard(professorId: string): Promise<number> {
    return await restCount('publications', { professor_id: 'eq.' + professorId })
  },
}

