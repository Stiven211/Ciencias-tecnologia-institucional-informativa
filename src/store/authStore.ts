import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Profile, Permission, UserRole } from '../types'
import { supabase } from '../lib/supabaseClient'
import { hasPermission as checkPermission, hasRole as checkRole, PERMISSIONS, isOwner as checkOwner } from '../config/permissions'
import { authService } from '../services/auth.service'

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  loading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  logout: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
  hasRole: (roles: UserRole | UserRole[]) => boolean
  isOwner: (ownerId: string) => boolean
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<User | null>
  register: (email: string, password: string, fullName: string) => Promise<User | null>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      loading: false,
      error: null,
      setUser: (user) => {
        if (user) {
          const permissions = PERMISSIONS[user.role as UserRole] || []
          set({ user: { ...user, permissions } })
        } else {
          set({ user: null })
        }
      },
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      logout: async () => {
        set({ loading: true, error: null })
        try {
          await supabase.auth.signOut()
          set({ user: null, profile: null })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Error al cerrar sesión' })
        } finally {
          set({ loading: false })
        }
      },
      hasPermission: (permission) => {
        const { user } = get()
        if (!user) return false
        return checkPermission(user.role, permission)
      },
      hasRole: (roles) => {
        const { user } = get()
        if (!user) return false
        const rolesArray = Array.isArray(roles) ? roles : [roles]
        return checkRole(user.role, rolesArray)
      },
      isOwner: (ownerId) => {
        const { user } = get()
        if (!user) return false
        return checkOwner(user.id, ownerId)
      },
      initialize: async () => {
        console.log('[authStore] initialize called')
        set({ isLoading: true })
        try {
          // Get current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) {
            console.error('[authStore] getSession error:', sessionError)
            throw sessionError
          }

          if (session?.user) {
            console.log('[authStore] Session found for user:', session.user.id)
            // Get profile first to get fullName, role and avatarUrl
            let profileData: Profile | null = null
            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
              
              if (error) {
                console.warn('[authStore] Could not fetch profile:', error)
              } else if (data) {
                profileData = data
                console.log('[authStore] Profile fetched:', profileData)
              }
            } catch (profileError) {
              console.warn('Could not fetch profile:', profileError)
            }
            
            // Build user from profile or defaults
            const currentUser: User | null = profileData ? {
              id: session.user.id,
              email: session.user.email ?? '',
              fullName: profileData.full_name,
              role: profileData.role,
              avatarUrl: profileData.avatar_url,
              permissions: PERMISSIONS[profileData.role] || []
            } : null
            
            console.log('[authStore] Setting user and profile in store')
            set({ user: currentUser, profile: profileData })
          } else {
            console.log('[authStore] No session found')
            set({ user: null, profile: null })
          }
        } catch (error) {
          console.error('[authStore] initialize error:', error)
          set({ user: null, profile: null })
        } finally {
          set({ isLoading: false })
        }
      },
      login: async (email: string, password: string) => {
        console.log('[authStore] login called for:', email)
        set({ loading: true, error: null })
        try {
          const user = await authService.signIn(email, password)
          console.log('[authStore] login result:', user ? 'success' : 'null')
          return user
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al iniciar sesión'
          console.error('[authStore] login error:', message)
          set({ error: message })
          throw error
        } finally {
          set({ loading: false })
        }
      },
      register: async (email: string, password: string, fullName: string) => {
        console.log('[authStore] register called for:', email)
        set({ loading: true, error: null })
        try {
          const user = await authService.signUp(email, password, fullName)
          console.log('[authStore] register result:', user ? 'success' : 'null')
          return user
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al registrarse'
          console.error('[authStore] register error:', message)
          set({ error: message })
          throw error
        } finally {
          set({ loading: false })
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)

// Set up auth state listener to keep zustand in sync
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session?.user) {
      // Get profile to get fullName, role and avatarUrl
      let profileData: Profile | null = null
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (!error && data) {
          profileData = data
        }
      } catch (profileError) {
        console.warn('Could not fetch profile:', profileError)
      }
      
      // Build user from profile or null
      const currentUser: User | null = profileData ? {
        id: session.user.id,
        email: session.user.email ?? '',
        fullName: profileData.full_name,
        role: profileData.role,
        avatarUrl: profileData.avatar_url,
        permissions: PERMISSIONS[profileData.role] || []
      } : null
      
      // Update zustand store
      useAuthStore.getState().setUser(currentUser)
      useAuthStore.getState().setProfile(profileData)
    }
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.getState().setUser(null)
    useAuthStore.getState().setProfile(null)
  }
})