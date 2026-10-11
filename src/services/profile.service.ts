import type { Profile, PublicProfile, UserRole } from '../types'
import { restSelect, restUpdate } from '../utils/supabaseRest'

export interface ProfileUpdateInput {
  full_name?: string
  bio?: string | null
  specialization?: string | null
  teaching_area?: string | null
  academic_level?: string | null
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
    if (data.teaching_area !== undefined) payload.teaching_area = data.teaching_area
    if (data.academic_level !== undefined) payload.academic_level = data.academic_level
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

  /**
   * Public read. `profiles` is private (owner + admins only) since the
   * 2026-10-10 migration, so anything rendered on the public site has to go
   * through the `public_profiles` view, which omits `email` by construction.
   */
  async getPublicProfileById(id: string): Promise<PublicProfile> {
    if (!id) {
      throw new Error('Identificador de usuario invalido.')
    }
    const rows = await restSelect<PublicProfile>(
      'public_profiles',
      'select=*&id=eq.' + id + '&limit=1'
    )
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

  /**
   * F1. Delegar o revocar el permiso de invitar profesores. El trigger
   * prevent_profile_invite_flag_escalation lo rechaza en BD si quien llama
   * no es admin, así que el 403 llega aunque el frontend se equivoque.
   */
  async updateInvitePermission(
    id: string,
    canInvite: boolean,
    context: UpdateRoleContext
  ): Promise<Profile> {
    if (!context.isAdmin) {
      throw new Error('No tienes permisos para delegar invitaciones.')
    }
    if (!id) {
      throw new Error('Identificador de usuario invalido.')
    }

    const updated = await restUpdate<Profile>(
      'profiles',
      { can_invite_teachers: canInvite },
      { id }
    )
    return updated[0]
  },
}
