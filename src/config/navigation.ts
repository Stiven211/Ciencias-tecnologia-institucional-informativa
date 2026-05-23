import { 
  LayoutDashboard, 
  FolderOpen, 
  User,
  Settings
} from 'lucide-react'
import type { Permission } from './permissions'
import type { UserRole } from './permissions'

export interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  permission: Permission
  roles?: UserRole[]
}

export const navigation: NavItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard, 
    permission: 'view_public_content' 
  },
  { 
    name: 'Mis Proyectos', 
    href: '/projects', 
    icon: FolderOpen, 
    permission: 'create_project'
  },
  { 
    name: 'Profesores', 
    href: '/teachers', 
    icon: User, 
    permission: 'view_public_content' 
  },
  { 
    name: 'Configuración', 
    href: '/settings', 
    icon: Settings, 
    permission: 'manage_teachers',
    roles: ['admin']
  },
]