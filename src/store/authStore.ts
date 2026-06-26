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
          return
        }
        
        set({ loading: true })
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) {
            set({ loading: false, initialized: true })
            return
          }

          if (session?.user) {
            let profileData: Profile | null = null
            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
              
              if (error) {
              } else if (data) {
                profileData = data
              }
            } catch (profileError) {
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
            
            set({ user: currentUser, profile: profileData, loading: false, initialized: true })
          } else {
            set({ user: null, profile: null, loading: false, initialized: true })
          }
        } catch (error) {
          set({ user: null, profile: null, loading: false, initialized: true })
        }
      },
      login: async (email: string, password: string) => {
        set({ loading: true, error: null })
        try {
          const user = await authService.signIn(email, password)
          if (user) {
            set({ user, loading: false, error: null })
          }
          return user
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al iniciar sesión'
          set({ error: message, loading: false })
          throw error
        }
      },
      register: async (email: string, password: string, fullName: string) => {
        set({ loading: true, error: null })
        try {
          const user = await authService.signUp(email, password, fullName)
          if (user) {
            set({ user, loading: false, error: null })
          }
          return user
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al registrarse'
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
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
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
            useAuthStore.setState({ loading: false, initialized: true })
          }
        }
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, profile: null, loading: false, initialized: true })
      }
    })
    authListener = data.subscription.unsubscribe
  }