export type UserRole = 'admin' | 'teacher' | 'visitor'

export type Permission =
  | 'create_project'
  | 'edit_own_project'
  | 'delete_own_project'
  | 'manage_all_projects'
  | 'manage_teachers'
  | 'view_public_content'

export const PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'create_project',
    'edit_own_project',
    'delete_own_project',
    'manage_all_projects',
    'manage_teachers',
    'view_public_content',
  ],
  teacher: [
    'create_project',
    'edit_own_project',
    'delete_own_project',
    'view_public_content',
  ],
  visitor: ['view_public_content'],
}

export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  return PERMISSIONS[userRole]?.includes(permission) ?? false
}

export const hasRole = (userRole: UserRole, roles: UserRole[]): boolean => {
  return roles.includes(userRole)
}

export const isOwner = (
  userId: string | undefined, 
  ownerId: string | undefined
): boolean => {
  if (!userId || !ownerId) return false
  return userId === ownerId
}