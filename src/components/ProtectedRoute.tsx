import { Navigate, useLocation, Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useInstitutionalUsers } from '../hooks/useInstitutionalUsers'
import type { Permission, UserRole } from '../config/permissions'

const LOADING_TIMEOUT_MS = 10000

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
  const { user, loading, initialized, initialize } = useAuthStore()
  const location = useLocation()
  const [timedOut, setTimedOut] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = useRef<number>(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!loading || initialized) {
      setTimedOut(false)
      return
    }
    timerRef.current = setTimeout(() => {
      if (loading || !initialized) {
        setTimedOut(true)
      }
    }, LOADING_TIMEOUT_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [loading, initialized])

  if (loading || !initialized) {
    if (timedOut) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-navy-50">
          <div className="text-center">
            <p className="text-navy-600 mb-4">La verificación está tardando demasiado.</p>
            <div className="space-x-3">
              <button
                onClick={initialize}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Reintentar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-navy-200 text-navy-800 rounded-md hover:bg-navy-300"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      )
    }
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
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="max-w-md text-center bg-white border border-red-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-900 mb-2">Acceso restringido</h2>
            <p className="text-navy-600 mb-6">
              No tienes permisos para acceder a esta sección. Si crees que es un error, contacta al administrador.
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      )
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
  const { user, loading, initialized, initialize } = useAuthStore()
  const { canRegister, loading: checkingLimit } = useInstitutionalUsers()
  const location = useLocation()
  const [timedOut, setTimedOut] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!loading && !checkingLimit && initialized) {
      setTimedOut(false)
      return
    }
    timerRef.current = setTimeout(() => {
      if (loading || !initialized || checkingLimit) {
        setTimedOut(true)
      }
    }, LOADING_TIMEOUT_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [loading, initialized, checkingLimit])

  const isChecking = loading || !initialized || checkingLimit

  if (location.pathname === '/register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Registro no disponible</h2>
            <p className="text-navy-600 mb-6">
              El registro público está cerrado. Contacte al administrador.
            </p>
            <Link to="/login" className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isChecking) {
    if (timedOut) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-navy-50">
          <div className="text-center">
            <p className="text-navy-600 mb-4">La verificación está tardando demasiado.</p>
            <div className="space-x-3">
              <button
                onClick={initialize}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Reintentar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-navy-200 text-navy-800 rounded-md hover:bg-navy-300"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      )
    }
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

  if (canRegister === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Registro no disponible</h2>
            <p className="text-navy-600 mb-6">
              Se alcanzó el límite de usuarios institucionales. Contacte al administrador.
            </p>
            <Link to="/login" className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}