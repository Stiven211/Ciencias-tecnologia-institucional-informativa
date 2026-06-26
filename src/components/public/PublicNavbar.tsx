import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useInstitutionalUsers } from '../../hooks/useInstitutionalUsers'
import { X, Menu } from 'lucide-react'
import { publicNavigation } from '../../config/publicNavigation'

export const PublicNavbar = () => {
  const { user } = useAuthStore()
  const { canRegister } = useInstitutionalUsers()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMenu = () => setMobileOpen(false)

  return (
    <nav className="bg-white border-b border-navy-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-3" onClick={closeMenu}>
                <img src="/logo.png" alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
                <span className="text-xl font-bold text-navy-900">
                  Área de Ciencias
                </span>
                <span className="hidden sm:inline text-green-600">y Tecnología</span>
              </Link>
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-6">
            {publicNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-navy-600 hover:text-navy-900 hover:bg-navy-50 transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <Link to="/dashboard/projects" className="px-3 py-2 rounded-md text-sm font-medium text-navy-600 hover:text-navy-900 hover:bg-navy-50 transition-colors">
              Mis Proyectos
            </Link>

            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <span className="text-sm font-medium text-navy-700">{user.fullName}</span>
                  <Link to="/dashboard" className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  {canRegister && (
                    <Link to="/register" className="px-3 py-1 border border-navy-300 text-navy-700 text-sm rounded-md hover:bg-navy-50 transition-colors">
                      Registrarse
                    </Link>
                  )}
                  <Link to="/login" className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors">
                    Iniciar sesión
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center justify-center p-2 rounded-md text-navy-600 hover:text-navy-900 hover:bg-navy-100 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/30" onClick={closeMenu} />
          <div className="fixed inset-y-0 right-0 w-72 bg-white shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-semibold text-navy-900">Menú</span>
              <button
                onClick={closeMenu}
                className="p-2 rounded-md text-navy-600 hover:bg-navy-100 transition-colors"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1">
              {publicNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMenu}
                  className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-navy-700 hover:bg-navy-50 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <Link to="/dashboard/projects" onClick={closeMenu} className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-navy-700 hover:bg-navy-50 transition-colors">
                Mis Proyectos
              </Link>
            </div>

            <div className="mt-auto space-y-2">
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-navy-600">{user.fullName}</div>
                  <Link to="/dashboard" onClick={closeMenu} className="block px-3 py-2 text-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  {canRegister && (
                    <Link to="/register" onClick={closeMenu} className="block px-3 py-2 text-center border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors">
                      Registrarse
                    </Link>
                  )}
                  <Link to="/login" onClick={closeMenu} className="block px-3 py-2 text-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Iniciar sesión
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
