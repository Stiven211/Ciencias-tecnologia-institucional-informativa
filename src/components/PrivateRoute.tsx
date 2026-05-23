import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { Permission, UserRole } from '../config/permissions'

interface PrivateRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requiredPermissions?: Permission[]
  requireAuth?: boolean
}

export const PrivateRoute = ({ 
  children, 
  allowedRoles, 
  requiredPermissions,
  requireAuth = true
}: PrivateRouteProps) => {
  const { user, isLoading, hasPermission, hasRole } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  if (requiredPermissions && user && !requiredPermissions.every(hasPermission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}