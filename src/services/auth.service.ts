import type { User, Profile } from '../types'
import { PERMISSIONS } from '../config/permissions'
import { restSelect, restCount, restInsert, restAuthLogin, restAuthLogout, getAccessTokenFromStorage, restAuthSignUp, restAuthResetPassword, restAuthUpdatePassword } from '../utils/supabaseRest'
import { withTimeout } from '../utils/fetchTimeout'

const MAX_INSTITUTIONAL_USERS = 7

const buildUserFromProfile = (profile: Profile): User => ({
  id: profile.id,
  email: profile.email,
  fullName: profile.full_name,
  role: profile.role,
  avatarUrl: profile.avatar_url,
  permissions: PERMISSIONS[profile.role] ?? [],
})

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
    return JSON.parse(decodeURIComponent(
      atob(padded)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    ))
  } catch {
    return null
  }
}

function getCurrentUserId(): string | null {
  const token = getAccessTokenFromStorage()
  if (!token) return null
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  const sub = payload.sub ?? payload.userId
  return typeof sub === 'string' ? sub : null
}

export const authService = {
  async getInstitutionalUsersCount(): Promise<number> {
    return restCount('profiles', {}, { mode: 'anon' })
  },

  async signUp(email: string, password: string, fullName: string): Promise<User | null> {
    const count = await restCount('profiles', {}, { mode: 'anon' })

    if (count >= MAX_INSTITUTIONAL_USERS) {
      throw new Error('Se alcanzo el limite de usuarios institucionales. Contacte al administrador.')
    }

    const session = await restAuthSignUp(email, password)

    await restInsert('profiles', [{
      id: session.user.id,
      email,
      full_name: fullName,
      role: 'teacher',
      avatar_url: null,
      bio: null,
      specialization: null,
    }])

    const rows = await withTimeout(
      restSelect<Profile>('profiles', 'select=*&id=eq.' + session.user.id),
      10000,
    )

    const profile = rows[0]
    if (!profile) throw new Error('No se encontro el perfil del usuario recien creado.')
    return buildUserFromProfile(profile)
  },

  async signIn(email: string, password: string): Promise<User | null> {
    const session = await restAuthLogin(email, password)

    const rows = await withTimeout(
      restSelect<Profile>('profiles', 'select=*&id=eq.' + session.user.id),
      10000,
    )

    const profile = rows[0]
    if (!profile) throw new Error('No se encontro el perfil del usuario.')
    return buildUserFromProfile(profile)
  },

  async signOut(): Promise<void> {
    await restAuthLogout()
  },

  async resetPassword(email: string, redirectTo: string): Promise<void> {
    await restAuthResetPassword(email, redirectTo)
  },

  async getCurrentProfile(): Promise<Profile | null> {
    const userId = getCurrentUserId()
    if (!userId) return null

    const rows = await withTimeout(
      restSelect<Profile>('profiles', 'select=*&id=eq.' + userId + '&limit=1'),
      10000,
    )

    return rows[0] ?? null
  },

  async changePassword(newPassword: string): Promise<void> {
    await restAuthUpdatePassword(newPassword)
  },
}
