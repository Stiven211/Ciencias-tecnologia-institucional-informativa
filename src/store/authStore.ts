import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Profile, Permission, UserRole } from '../types'
import { supabase } from '../lib/supabaseClient'
import { hasPermission as checkPermission, hasRole as checkRole, PERMISSIONS, isOwner as checkOwner } from '../config/permissions'
import { authService } from '../services/auth.service'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  error: string | null
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
  hasRole: (roles: UserRole | UserRole[]) => boolean
  isOwner: (ownerId: string) => boolean
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<User | null>
  register: (email: string, password: string, fullName: string) => Promise<User | null>
}

type Unsubscribe = () => void

let authListener: Unsubscribe | null = null

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,
      initialized: false,
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
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      logout: async () => {
        set({ loading: true, error: null })
        try {
          await supabase.auth.signOut()
          set({ user: null, profile: null, loading: false, initialized: true })
          console.log('[authStore] clearing auth state')
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Error al cerrar sesión', loading: false })
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
        const state = get()
        if (state.initialized) {
          console.log('[authStore] already initialized, skipping')
          return
        }
        
        console.log('[authStore] initialize called')
        set({ loading: true })
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) {
            console.error('[authStore] getSession error:', sessionError)
            set({ loading: false, initialized: true })
            return
          }

          if (session?.user) {
            console.log('[authStore] Session found for user:', session.user.id)
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
            
            const currentUser: User = profileData ? {
              id: session.user.id,
              email: session.user.email ?? '',
              fullName: profileData.full_name,
              role: profileData.role as UserRole,
              avatarUrl: profileData.avatar_url,
              permissions: PERMISSIONS[profileData.role as UserRole] || []
            } : {
              id: session.user.id,
              email: session.user.email ?? '',
              fullName: session.user.email?.split('@')[0] || 'User',
              role: 'visitor',
              permissions: PERMISSIONS['visitor'] || []
            }
            
            console.log('[authStore] setting user')
            set({ user: currentUser, profile: profileData, loading: false, initialized: true })
          } else {
            console.log('[authStore] No session found')
            set({ user: null, profile: null, loading: false, initialized: true })
          }
        } catch (error) {
          console.error('[authStore] initialize error:', error)
          set({ user: null, profile: null, loading: false, initialized: true })
        }
      },
      login: async (email: string, password: string) => {
        console.log('[authStore] login called for:', email)
        set({ loading: true, error: null })
        try {
          const user = await authService.signIn(email, password)
          console.log('[authStore] login result:', user ? 'success' : 'null')
          if (user) {
            set({ user, loading: false, error: null })
          }
          return user
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al iniciar sesión'
          console.error('[authStore] login error:', message)
          set({ error: message, loading: false })
          throw error
        }
      },
      register: async (email: string, password: string, fullName: string) => {
        console.log('[authStore] register called for:', email)
        set({ loading: true, error: null })
        try {
          const user = await authService.signUp(email, password, fullName)
          console.log('[authStore] register result:', user ? 'success' : 'null')
          if (user) {
            set({ user, loading: false, error: null })
          }
          return user
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al registrarse'
          console.error('[authStore] register error:', message)
          set({ error: message, loading: false })
          throw error
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)

if (!authListener) {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[authStore] onAuthStateChange:', event, session?.user?.id)
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
      if (session?.user) {
        console.log('[authStore] setting user')
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          const currentUser: User = data ? {
            id: session.user.id,
            email: session.user.email ?? '',
            fullName: data.full_name,
            role: data.role as UserRole,
            avatarUrl: data.avatar_url,
            permissions: PERMISSIONS[data.role as UserRole] || []
          } : {
            id: session.user.id,
            email: session.user.email ?? '',
            fullName: session.user.email?.split('@')[0] || 'User',
            role: 'visitor',
            permissions: PERMISSIONS['visitor'] || []
          }
          useAuthStore.setState({ user: currentUser, profile: data, loading: false, initialized: true })
        } catch (err: unknown) {
          console.warn('Could not fetch profile:', err)
          useAuthStore.setState({ loading: false, initialized: true })
        }
      }
    } else if (event === 'SIGNED_OUT') {
      console.log('[authStore] clearing auth state')
      useAuthStore.setState({ user: null, profile: null, loading: false, initialized: true })
    }
  })
  authListener = data.subscription.unsubscribe
}