import type { ReactNode } from 'react'
import { usePermissions } from '../../hooks/usePermissions'

interface OwnershipGuardProps {
  ownerId: string | undefined
  fallback?: ReactNode
  children: ReactNode
}

export const OwnershipGuard = ({ 
  ownerId, 
  fallback = null, 
  children
}: OwnershipGuardProps) => {
  const { isAdmin, isOwner } = usePermissions()

  const isContentOwner = isOwner(ownerId)
  const canAccess = isContentOwner || isAdmin()

  if (!canAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}