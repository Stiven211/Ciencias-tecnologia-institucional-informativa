import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Profile, Permission, UserRole } from '../types'
import { supabase } from '../lib/supabaseClient'
import { hasPermission as checkPermission, hasRole as checkRole, PERMISSIONS, isOwner as checkOwner } from '../config/permissions'
import { authService } from '../services/auth.service'

const INIT_TIMEOUT_MS = 20000

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

const fetchProfileAndBuildUser = async (userId: string, email: string | null | undefined): Promise<{ user: User; profile: Profile | null }> => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (data) {
      const profile = data as Profile
      return {
        profile,
        user: {
          id: userId,
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role,
          avatarUrl: profile.avatar_url,
          permissions: PERMISSIONS[profile.role] ?? [],
        },
      }
    }

    return {
      profile: null,
      user: {
        id: userId,
        email: email ?? '',
        fullName: email?.split('@')[0] ?? 'User',
        role: 'visitor',
        permissions: PERMISSIONS['visitor'] ?? [],
      },
    }
  } catch {
    return {
      profile: null,
      user: {
        id: userId,
        email: email ?? '',
        fullName: email?.split('@')[0] ?? 'User',
        role: 'visitor',
        permissions: PERMISSIONS['visitor'] ?? [],
      },
    }
  }
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer))
}

const initAuthListener = (): void => {
  if (authListener) return
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
      if (session?.user) {
        try {
          const { user, profile } = await fetchProfileAndBuildUser(session.user.id, session.user.email)
          useAuthStore.setState({ user, profile, loading: false, initialized: true })
        } catch {
          // On error, keep existing user if any, just mark as initialized
          const currentState = useAuthStore.getState()
          if (currentState.user) {
            useAuthStore.setState({ loading: false, initialized: true })
          } else {
            useAuthStore.setState({ user: null, profile: null, loading: false, initialized: true })
          }
        }
      } else {
        useAuthStore.setState({ user: null, profile: null, loading: false, initialized: true })
      }
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ user: null, profile: null, loading: false, initialized: true })
    }
  })
  authListener = data.subscription.unsubscribe
}

initAuthListener()

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
          const permissions = PERMISSIONS[user.role] ?? []
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
        if (state.initialized) return

        set({ loading: true })
        try {
          const { data: { session } } = await withTimeout(supabase.auth.getSession(), INIT_TIMEOUT_MS)

          if (session?.user) {
            const { user, profile } = await withTimeout(
              fetchProfileAndBuildUser(session.user.id, session.user.email),
              INIT_TIMEOUT_MS,
            )
            set({ user, profile, loading: false, initialized: true })
          } else {
            // No session in Supabase, but we might have a persisted user from localStorage
            // Don't clear it yet - let the auth listener handle it
            const currentUser = get().user
            if (currentUser) {
              set({ loading: false, initialized: true })
            } else {
              set({ user: null, profile: null, loading: false, initialized: true })
            }
          }
        } catch {
          // Timeout or error: keep persisted user if exists, don't clear it
          const currentUser = get().user
          if (currentUser) {
            set({ loading: false, initialized: true })
          } else {
            set({ user: null, profile: null, loading: false, initialized: true })
          }
        }
      },
      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const user = await authService.signIn(email, password)
          set({ user, loading: false, initialized: true })
          return user
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al iniciar sesión'
          set({ error: message, loading: false })
          throw error
        }
      },
      register: async (email, password, fullName) => {
        set({ loading: true, error: null })
        try {
          const user = await authService.signUp(email, password, fullName)
          set({ user, loading: false, initialized: true })
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
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    }
  )
)