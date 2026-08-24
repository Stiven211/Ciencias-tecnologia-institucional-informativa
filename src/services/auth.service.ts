import { supabase } from '../lib/supabaseClient'
import type { User, Profile } from '../types'
import { PERMISSIONS } from '../config/permissions'

const buildUserFromProfile = (profile: Profile): User => ({
  id: profile.id,
  email: profile.email,
  fullName: profile.full_name,
  role: profile.role,
  avatarUrl: profile.avatar_url,
  permissions: PERMISSIONS[profile.role] ?? [],
})

export const authService = {
  async getInstitutionalUsersCount() {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'teacher')

    if (error) throw error
    return count ?? 0
  },

  async signUp(email: string, password: string, fullName: string) {
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'teacher')

    if (countError) throw countError
    if ((count ?? 0) >= 7) {
      throw new Error('Se alcanzó el límite de 7 profesores. Contacte al administrador.')
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } },
    })

    if (error) throw error
    if (!data.user) return null

    // El trigger de Supabase crea el perfil con rol teacher de forma atómica.
    if (!data.session) return null

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw profileError
    return buildUserFromProfile(profile as Profile)
  },

  async signIn(email: string, password: string) {
    console.log('[authService] Starting signIn for:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[authService] signIn error:', error)
      throw error
    }
    
    console.log('[authService] auth user signed in:', data.user?.id)
    
    // Fetch profile and return full user
    if (data.user) {
      console.log('[authService] Fetching profile for user:', data.user.id)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        console.error('[authService] profile fetch error:', profileError)
        throw profileError
      }
      
      console.log('[authService] Profile fetched:', profile)
      return buildUserFromProfile(profile as Profile)
    }
    
    return null
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch profile and return full user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError) throw profileError
    return buildUserFromProfile(profile as Profile)
  },

  async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data as Profile | null
  }
}