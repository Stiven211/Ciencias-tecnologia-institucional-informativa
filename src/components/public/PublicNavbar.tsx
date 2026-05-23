import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export const PublicNavbar = () => {
  const { user } = useAuthStore()

  return (
    <nav className="bg-white border-b border-navy-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-navy-900">
                  Área de Ciencias
                </span>
                <span className="text-green-600">y Tecnología</span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-navy-600 hover:text-navy-900 hover:bg-navy-50"
                >
                  Inicio
                </Link>
                <Link
                  to="/projects"
                  className="px-3 py-2 rounded-md text-sm font-medium text-navy-600 hover:text-navy-900 hover:bg-navy-50"
                >
                  Proyectos
                </Link>
                <Link
                  to="/professors"
                  className="px-3 py-2 rounded-md text-sm font-medium text-navy-600 hover:text-navy-900 hover:bg-navy-50"
                >
                  Profesores
                </Link>
                <Link
                  to="/about"
                  className="px-3 py-2 rounded-md text-sm font-medium text-navy-600 hover:text-navy-900 hover:bg-navy-50"
                >
                  Acerca de
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-3">
              {user ? (
                <>
                  <span className="text-sm font-medium text-navy-700">
                    {user.fullName}
                  </span>
                  <Link
                    to="/dashboard"
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <button className="inline-flex items-center p-2 text-navy-600 hover:text-navy-900">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}