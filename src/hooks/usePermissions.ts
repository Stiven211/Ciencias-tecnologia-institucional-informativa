import { useAuthStore } from '../store/authStore'
import type { Permission, UserRole } from '../config/permissions'

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const hasRole = useAuthStore((state) => state.hasRole)
  const isOwner = useAuthStore((state) => state.isOwner)

  const can = (permission: Permission): boolean => {
    return hasPermission(permission)
  }

  const checkRole = (roles: UserRole | UserRole[]): boolean => {
    return hasRole(roles)
  }

  const checkIsOwner = (ownerId: string | undefined): boolean => {
    if (!ownerId) return false
    return isOwner(ownerId)
  }

  const isAdmin = (): boolean => {
    return user?.role === 'admin'
  }

  const isTeacher = (): boolean => {
    return user?.role === 'teacher'
  }

  const isVisitor = (): boolean => {
    return user?.role === 'visitor' || !user
  }

  return {
    can,
    hasRole: checkRole,
    isOwner: checkIsOwner,
    isAdmin,
    isTeacher,
    isVisitor,
    permissions: user?.permissions || [],
    role: user?.role,
    userId: user?.id,
  }
}