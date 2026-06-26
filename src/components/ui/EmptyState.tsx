import { type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-navy-900 mb-2">{title}</h3>
      <p className="text-navy-600 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  )
}