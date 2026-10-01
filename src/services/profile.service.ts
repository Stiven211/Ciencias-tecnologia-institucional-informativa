import type { Profile, UserRole } from '../types'
import { restSelect, restUpdate } from '../utils/supabaseRest'

export interface ProfileUpdateInput {
  full_name?: string
  bio?: string | null
  specialization?: string | null
  avatar_url?: string | null
  [key: string]: string | null | undefined
}

export interface UpdateRoleContext {
  userId: string
  isAdmin: boolean
}

export const profileService = {
  async updateProfile(userId: string, data: ProfileUpdateInput): Promise<Profile> {
    if (!userId) {
      throw new Error('Identificador de usuario invalido.')
    }

    const payload: ProfileUpdateInput = {}
    if (data.full_name !== undefined) payload.full_name = data.full_name
    if (data.bio !== undefined) payload.bio = data.bio
    if (data.specialization !== undefined) payload.specialization = data.specialization
    if (data.avatar_url !== undefined) payload.avatar_url = data.avatar_url

    if (Object.keys(payload).length === 0) {
      throw new Error('No hay cambios para guardar.')
    }

    const updated = await restUpdate<Profile>('profiles', payload, { id: userId })
    return updated[0]
  },

  async updateAvatarUrl(userId: string, url: string | null): Promise<Profile> {
    if (!userId) {
      throw new Error('Identificador de usuario invalido.')
    }
    return profileService.updateProfile(userId, { avatar_url: url })
  },

  async getProfileById(id: string): Promise<Profile> {
    if (!id) {
      throw new Error('Identificador de usuario invalido.')
    }
    const rows = await restSelect<Profile>('profiles', 'select=*&id=eq.' + id + '&limit=1')
    if (!rows[0]) {
      throw new Error('No se pudo cargar el perfil.')
    }
    return rows[0]
  },

  async updateProfessorRole(
    id: string,
    role: UserRole,
    context: UpdateRoleContext
  ): Promise<Profile> {
    if (!context.isAdmin) {
      throw new Error('No tienes permisos para cambiar roles.')
    }
    if (!id) {
      throw new Error('Identificador de usuario invalido.')
    }
    if (id === context.userId && role !== 'admin') {
      throw new Error('Un administrador no puede quitarse su propio rol admin.')
    }

    const updated = await restUpdate<Profile>('profiles', { role }, { id })
    return updated[0]
  },
}
