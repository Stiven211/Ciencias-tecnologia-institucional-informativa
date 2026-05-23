import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = ({ className, icon, title, description, action }: EmptyStateProps) => {
  return (
    <div
      className={cn('flex flex-col items-center justify-center text-center py-12', className)}
    >
      {icon && (
        <div className="mb-4 text-navy-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-navy-900 mb-2">{title}</h3>
      {description && <p className="text-navy-600 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}