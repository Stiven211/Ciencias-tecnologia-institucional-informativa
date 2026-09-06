import { supabase } from '../lib/supabaseClient'
import type { User, Profile } from '../types'
import { PERMISSIONS } from '../config/permissions'

const MAX_INSTITUTIONAL_USERS = 7

const buildUserFromProfile = (profile: Profile): User => ({
  id: profile.id,
  email: profile.email,
  fullName: profile.full_name,
  role: profile.role,
  avatarUrl: profile.avatar_url,
  permissions: PERMISSIONS[profile.role] ?? [],
})

export const authService = {
  async getInstitutionalUsersCount(): Promise<number> {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })

    if (error) throw error
    return count ?? 0
  },

  async signUp(email: string, password: string, fullName: string): Promise<User | null> {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })

    if ((count ?? 0) >= MAX_INSTITUTIONAL_USERS) {
      throw new Error('Se alcanzó el límite de usuarios institucionales. Contacte al administrador.')
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) throw signUpError
    if (!signUpData.user) return null

    let session = signUpData.session
    if (!session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
      session = signInData.session
    }

    const { error: insertError } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      email,
      full_name: fullName,
      role: 'teacher',
      avatar_url: null,
      bio: null,
      specialization: null,
    })

    if (insertError) throw insertError

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .single()

    if (profileError) throw profileError
    return buildUserFromProfile(profile as Profile)
  },

  async signIn(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.user) return null

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw profileError
    return buildUserFromProfile(profile as Profile)
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string, redirectTo: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  },

  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return (data as Profile | null) ?? null
  },

  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },
}