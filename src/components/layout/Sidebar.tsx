import { 
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { navigation } from '../../config/navigation'

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { user, hasPermission, hasRole } = useAuthStore()

  const visibleNav = navigation.filter(item => {
    if (!hasPermission(item.permission)) return false
    if (item.roles && !hasRole(item.roles)) return false
    return true
  })

  return (
    <div className={`bg-navy-900 text-white h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-navy-800">
        {!collapsed && (
          <h1 className="text-xl font-bold text-green-500">Ciencias</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-navy-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {visibleNav.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-green-500 text-white' 
                  : 'text-navy-300 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-navy-800">
        {!collapsed && user && (
          <div className="text-sm">
            <p className="font-medium text-white">{user.fullName}</p>
            <p className="text-navy-400 capitalize">{user.role}</p>
          </div>
        )}
      </div>
    </div>
  )
}