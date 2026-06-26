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
    <aside className={`bg-navy-900 text-white h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-6 border-b border-navy-800/50">
        {!collapsed && (
          <Link to="/" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
            Ciencias
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-navy-800 transition-colors ml-auto"
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNav.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'text-navy-400 hover:bg-navy-800 hover:text-white'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon size={20} className={isActive ? 'text-blue-400' : 'group-hover:text-white'} />
              {!collapsed && <span className="ml-3 font-medium">{item.name}</span>}
              {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"></div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-navy-800/50">
        {!collapsed && user && (
          <div className="flex items-center space-x-3 px-2 py-3">
            <div className="w-10 h-10 bg-navy-700 rounded-full flex items-center justify-center text-sm font-medium">
              {user.fullName?.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-white text-sm">{user.fullName}</p>
              <p className="text-navy-400 capitalize text-xs">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}