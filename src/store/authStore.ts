import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Profile, Permission, UserRole } from '../types'
import { hasPermission as checkPermission, hasRole as checkRole, PERMISSIONS, isOwner as checkOwner } from '../config/permissions'
import { authService } from '../services/auth.service'

const createSafeSessionStorage = (): Storage => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    }
  }

  try {
    return window.sessionStorage
  } catch {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    }
  }
}

const authStorage = createJSONStorage(() => createSafeSessionStorage())

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

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer))
}

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
          await authService.signOut()
          set({ user: null, profile: null, loading: false, initialized: true })
        } catch (error) {
          set({ user: null, profile: null, error: error instanceof Error ? error.message : 'Error al cerrar sesión', loading: false, initialized: true })
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
          const profile = await withTimeout(authService.getCurrentProfile(), INIT_TIMEOUT_MS)

          if (profile) {
            set({
              user: {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                role: profile.role,
                avatarUrl: profile.avatar_url,
                permissions: PERMISSIONS[profile.role] ?? [],
              },
              profile,
              loading: false,
              initialized: true,
            })
          } else {
            set({ user: null, profile: null, loading: false, initialized: true })
          }
        } catch {
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
      storage: authStorage,
      partialize: (state) => ({ user: state.user, profile: state.profile, initialized: state.initialized }),
    }
  )
)
