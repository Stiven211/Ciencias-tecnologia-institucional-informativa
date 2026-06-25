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
      .select('id', { count: 'exact' })

    if (error) throw error
    return count ?? 0
  },

  async signUp(email: string, password: string, fullName: string) {
    console.log('[authService] Starting signUp for:', email)

    const MAX_INSTITUTIONAL_USERS = 7
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })

    if ((count ?? 0) >= MAX_INSTITUTIONAL_USERS) {
      throw new Error('Se alcanzó el límite de usuarios institucionales. Contacte al administrador.')
    }

    // Step 1: Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      console.error('[authService] signUp error:', signUpError)
      throw signUpError
    }

    console.log('[authService] auth user created:', signUpData.user?.id)
    
    // Step 2: Get a session - either from signUp or by signing in
    let session = signUpData.session
    if (!session) {
      console.log('[authService] No session from signUp, attempting to sign in to get session')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        console.error('[authService] signIn to get session error:', signInError)
        throw signInError
      }
      session = signInData.session
      console.log('[authService] Obtained session via signIn')
    }
    
    // Step 3: Now we have a session, create profile for the new user
    if (signUpData.user) {
      console.log('[authService] Creating profile for user:', signUpData.user.id)
      const { error: insertError } = await supabase.from('profiles').insert({
        id: signUpData.user.id,
        email,
        full_name: fullName,
        role: 'teacher', // default role
        avatar_url: '',
        bio: '',
        specialization: '',
      })
      
      if (insertError) {
        console.error('[authService] profile insert error:', insertError)
        throw insertError
      }
      
      console.log('[authService] Profile created successfully')
    }

    // Step 4: Fetch the created profile and return full user
    if (signUpData.user) {
      console.log('[authService] Fetching profile for user:', signUpData.user.id)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
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