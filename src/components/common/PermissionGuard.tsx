import type { ReactNode } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import type { Permission, UserRole } from '../../config/permissions'

interface PermissionGuardProps {
  permission?: Permission
  role?: UserRole | UserRole[]
  fallback?: ReactNode
  children: ReactNode
}

export const PermissionGuard = ({ 
  permission, 
  role, 
  fallback = null, 
  children 
}: PermissionGuardProps) => {
  const { can, hasRole } = usePermissions()

  if (permission && !can(permission)) {
    return <>{fallback}</>
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}