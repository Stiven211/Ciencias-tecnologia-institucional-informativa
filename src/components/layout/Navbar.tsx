import { Bell, Search, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export const Navbar = () => {
  const { user, logout } = useAuthStore()

  return (
    <header className="bg-white border-b border-navy-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cursos, recursos..."
              className="w-full pl-10 pr-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-100 rounded-lg transition-colors">
            <Bell size={20} />
          </button>

          <div className="relative group">
            <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-navy-100 transition-colors">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <span className="text-sm font-medium text-navy-900">{user?.fullName}</span>
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-navy-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="p-2">
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-100 rounded-md"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}