import { supabase } from '../lib/supabaseClient'
import type { Profile, UserRole } from '../types'

export interface ProfileUpdateInput {
  full_name?: string
  bio?: string | null
  specialization?: string | null
  avatar_url?: string | null
}

export interface UpdateRoleContext {
  userId: string
  isAdmin: boolean
}

const ensure = (error: { message: string } | null, fallback: string): never => {
  if (error) throw new Error(fallback)
}

export const profileService = {
  /**
   * Actualiza los campos editables del perfil (full_name, bio, specialization, avatar_url).
   * El userId debe corresponder al perfil del usuario autenticado; cualquier RLS adicional
   * se aplica en la DB.
   */
  async updateProfile(userId: string, data: ProfileUpdateInput): Promise<Profile> {
    if (!userId) {
      throw new Error('Identificador de usuario inválido.')
    }

    const payload: ProfileUpdateInput = {}
    if (data.full_name !== undefined) payload.full_name = data.full_name
    if (data.bio !== undefined) payload.bio = data.bio
    if (data.specialization !== undefined) payload.specialization = data.specialization
    if (data.avatar_url !== undefined) payload.avatar_url = data.avatar_url

    if (Object.keys(payload).length === 0) {
      throw new Error('No hay cambios para guardar.')
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single()

    ensure(error, 'No se pudo actualizar el perfil.')
    return updated as Profile
  },

  /**
   * Atajo para actualizar únicamente el avatar_url de un perfil.
   */
  async updateAvatarUrl(userId: string, url: string | null): Promise<Profile> {
    if (!userId) {
      throw new Error('Identificador de usuario inválido.')
    }
    return profileService.updateProfile(userId, { avatar_url: url })
  },

  async getProfileById(id: string): Promise<Profile> {
    if (!id) {
      throw new Error('Identificador de usuario inválido.')
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    ensure(error, 'No se pudo cargar el perfil.')
    return data as Profile
  },

  /**
   * Cambia el rol de un usuario. Solo admin puede hacerlo.
   * Guarda: un admin no puede quitarse a sí mismo el rol admin
   * (eso dejaría al sistema sin administradores y la RLS fallaría).
   */
  async updateProfessorRole(
    id: string,
    role: UserRole,
    context: UpdateRoleContext
  ): Promise<Profile> {
    if (!context.isAdmin) {
      throw new Error('No tienes permisos para cambiar roles.')
    }
    if (!id) {
      throw new Error('Identificador de usuario inválido.')
    }
    if (id === context.userId && role !== 'admin') {
      throw new Error('Un administrador no puede quitarse su propio rol admin.')
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select('*')
      .single()

    ensure(error, 'No se pudo actualizar el rol del profesor.')
    return updated as Profile
  },
}