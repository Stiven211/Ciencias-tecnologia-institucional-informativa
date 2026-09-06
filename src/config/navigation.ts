import {
  LayoutDashboard,
  FolderOpen,
  Shield,
  User,
  FileText,
  BookOpen,
  Calendar
} from 'lucide-react'
import type { Permission, UserRole } from './permissions'

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
    href: '/dashboard/projects', 
    icon: FolderOpen, 
    permission: 'create_project'
  },
  { 
    name: 'Mis Recursos', 
    href: '/dashboard/resources', 
    icon: FileText, 
    permission: 'create_resource'
  },
  { 
    name: 'Publicaciones', 
    href: '/dashboard/publications', 
    icon: BookOpen, 
    permission: 'create_publication'
  },
  { 
    name: 'Actividades', 
    href: '/dashboard/activities', 
    icon: Calendar, 
    permission: 'create_activity'
  },
  { 
    name: 'Mi Perfil', 
    href: '/dashboard/profile', 
    icon: User, 
    permission: 'view_public_content'
  },
  { 
    name: 'Profesores', 
    href: '/dashboard/admin', 
    icon: Shield, 
    permission: 'manage_all_projects',
    roles: ['admin']
  },
]