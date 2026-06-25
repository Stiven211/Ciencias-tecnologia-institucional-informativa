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
    <nav className="bg-white border-b border-navy-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
                <span className="text-2xl font-bold text-navy-900">
                  Área de Ciencias
                </span>
                <span className="text-green-600">y Tecnología</span>
              </Link>
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-6">
            {publicNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-navy-600 hover:text-navy-900 hover:bg-navy-50"
              >
                {item.name}
              </Link>
            ))}
            <Link to="/dashboard/projects" className="px-3 py-2 rounded-md text-sm font-medium text-navy-600 hover:text-navy-900 hover:bg-navy-50">
              Mis Proyectos
            </Link>

            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <span className="text-sm font-medium text-navy-700">{user.fullName}</span>
                  <Link to="/dashboard" className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  {canRegister && (
                    <Link to="/register" className="px-3 py-1 border border-navy-300 text-navy-700 text-sm rounded-md hover:bg-navy-50">
                      Registrarse
                    </Link>
                  )}
                  <Link to="/login" className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
                    Iniciar sesión
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center justify-center p-2 rounded-md text-navy-600 hover:text-navy-900 hover:bg-navy-100"
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={closeMenu} />
          <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-lg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-bold text-navy-900">Menú</span>
              <button
                onClick={closeMenu}
                className="p-2 rounded-md text-navy-600 hover:bg-navy-100"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {publicNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-navy-700 hover:bg-navy-50"
                >
                  {item.name}
                </Link>
              ))}
              <Link to="/dashboard/projects" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-navy-700 hover:bg-navy-50">
                Mis Proyectos
              </Link>
            </div>

            <div className="mt-auto space-y-2">
              {user ? (
                <>
                  <span className="block px-3 py-2 text-sm text-navy-600">{user.fullName}</span>
                  <Link to="/dashboard" onClick={closeMenu} className="block px-3 py-2 text-center bg-green-600 text-white rounded-md hover:bg-green-700">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  {canRegister && (
                    <Link to="/register" onClick={closeMenu} className="block px-3 py-2 text-center border border-navy-300 rounded-md hover:bg-navy-50">
                      Registrarse
                    </Link>
                  )}
                  <Link to="/login" onClick={closeMenu} className="block px-3 py-2 text-center bg-green-600 text-white rounded-md hover:bg-green-700">
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
