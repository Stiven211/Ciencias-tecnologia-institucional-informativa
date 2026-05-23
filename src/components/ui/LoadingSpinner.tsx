import { cn } from '../../utils/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-navy-200 border-t-green-500',
        sizes[size],
        className
      )}
    />
  )
}

interface CenteredSpinnerProps extends LoadingSpinnerProps {
  text?: string
}

export const LoadingSpinnerCentered = ({ size = 'md', text, className }: CenteredSpinnerProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <LoadingSpinner size={size} />
      {text && <p className="text-navy-600 mt-3">{text}</p>}
    </div>
  )
}