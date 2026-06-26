import { cn } from '../../utils/cn'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rounded' | 'button'
  height?: string
  width?: string
}

export const Skeleton = ({ className, variant = 'text', height, width }: SkeletonProps) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
    button: 'h-10 rounded-lg',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-navy-200',
        variants[variant],
        className
      )}
      style={{
        height: height,
        width: width,
      }}
    />
  )
}

export const SkeletonCard = ({ className }: { className?: string }) => {
  return (
    <div className={cn('bg-white rounded-xl border border-navy-200 p-6 animate-pulse', className)}>
      <div className="space-y-3">
        <Skeleton height="1.5rem" width="60%" />
        <Skeleton height="1rem" width="100%" />
        <Skeleton height="1rem" width="80%" />
        <div className="flex gap-2 pt-2">
          <Skeleton height="1.25rem" width="4rem" variant="rounded" />
          <Skeleton height="1.25rem" width="4rem" variant="rounded" />
        </div>
      </div>
    </div>
  )
}

export const SkeletonStats = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-navy-200 p-6 animate-pulse">
          <Skeleton variant="rounded" height="2.5rem" width="2.5rem" className="mb-3" />
          <Skeleton height="1.5rem" width="3rem" className="mb-1" />
          <Skeleton height="1rem" width="4rem" />
        </div>
      ))}
    </div>
  )
}