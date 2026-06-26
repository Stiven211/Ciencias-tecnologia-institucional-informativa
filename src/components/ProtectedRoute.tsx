import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useInstitutionalUsers } from '../hooks/useInstitutionalUsers'
import type { Permission, UserRole } from '../config/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requiredPermissions?: Permission[]
  requireAuth?: boolean
  redirectTo?: string
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  requiredPermissions,
  requireAuth = true,
  redirectTo = '/login'
}: ProtectedRouteProps) => {
  const { user, loading, initialized } = useAuthStore()
  const location = useLocation()

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-navy-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  if (requiredPermissions && user) {
    const { hasPermission } = useAuthStore.getState()
    const allHavePermission = requiredPermissions.every(hasPermission)
    if (!allHavePermission) {
      return <div className="p-6"><p className="text-red-600">No tienes permisos para crear proyectos. Rol actual: {user.role}. Contacta al administrador.</p></div>
    }
  }

  return <>{children}</>
}

interface PublicOnlyRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export const PublicOnlyRoute = ({ 
  children, 
  redirectTo = '/dashboard' 
}: PublicOnlyRouteProps) => {
  const { user, loading, initialized } = useAuthStore()
  const { canRegister } = useInstitutionalUsers()
  const location = useLocation()

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-navy-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  if (!canRegister && location.pathname === '/register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Registro no disponible</h2>
            <p className="text-navy-600 mb-6">
              Se alcanzó el límite de usuarios institucionales. Contacte al administrador.
            </p>
            <Link
              to="/login"
              className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}