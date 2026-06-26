import { type HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
  title?: string
  description?: string
  footer?: React.ReactNode
}

export const Card = ({ className, variant = 'default', title, description, footer, children, ...props }: CardProps) => {
  const variants = {
    default: 'bg-white border border-navy-200 hover:border-navy-300 hover:shadow-md transition-all duration-200',
    bordered: 'bg-white border-2 border-navy-300',
    elevated: 'bg-white shadow-sm hover:shadow-lg transition-shadow duration-200',
  }

  return (
    <div
      className={cn('rounded-xl overflow-hidden', variants[variant], className)}
      {...props}
    >
      {(title || description) && (
        <div className="px-6 pt-6 pb-2">
          {title && <h3 className="text-lg font-semibold text-navy-900">{title}</h3>}
          {description && <p className="text-sm text-navy-600 mt-1">{description}</p>}
        </div>
      )}
      <div className={cn('px-6 py-4', (title || description) && 'pt-2')}>{children}</div>
      {footer && <div className="px-6 pb-6">{footer}</div>}
    </div>
  )
}