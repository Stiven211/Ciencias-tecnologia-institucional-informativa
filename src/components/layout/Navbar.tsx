import { useState, useEffect } from 'react'
import { Search, Home, User, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface NavbarProps {
  onOpenSidebar?: () => void
}

export const Navbar = ({ onOpenSidebar }: NavbarProps) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    const close = () => setUserMenuOpen(false)
    if (userMenuOpen) {
      window.addEventListener('click', close)
      return () => window.removeEventListener('click', close)
    }
  }, [userMenuOpen])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchValue.trim()
    navigate(q ? `/dashboard/projects?q=${encodeURIComponent(q)}` : '/dashboard/projects')
  }

  return (
    <header className="bg-white border-b border-navy-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="lg:hidden p-2 rounded-lg text-navy-600 hover:bg-navy-100"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
          )}
          <form onSubmit={submitSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={20} />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Buscar proyectos..."
                aria-label="Buscar proyectos"
                className="w-full pl-10 pr-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-100 rounded-lg transition-colors"
            aria-label="Ir al sitio público"
          >
            <Home size={20} />
            <span className="hidden sm:inline font-medium">Inicio</span>
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setUserMenuOpen((v) => !v)
              }}
              className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-navy-100 transition-colors"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-navy-900">{user?.fullName}</span>
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-navy-200 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      logout()
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-100 rounded-md"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}