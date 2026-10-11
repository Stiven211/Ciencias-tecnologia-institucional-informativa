import type { ComponentType } from 'react'
import { Card } from '../ui/Card'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ComponentType<{ size?: number; className?: string }>
  trend?: {
    value: number
    positive: boolean
  }
  description?: string
  className?: string
}

export const StatsCard = ({ 
   title, 
   value, 
   icon: Icon, 
   trend, 
   description,
   className,
   ...props 
 }: StatsCardProps) => {
   return (
      <Card className={className} {...props}>
        {/* En movil la tarjeta va en horizontal: el bloque vertical ocupaba
            ~200px de alto por tarjeta y tres tarjetas empujaban todo el
            contenido util fuera de la primera pantalla. */}
        <div className="flex items-center gap-4 sm:block">
          <div className="p-2.5 sm:p-3 bg-navy-50 rounded-xl shrink-0">
            <Icon size={22} className="text-navy-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 sm:block">
              <h3 className="text-xl sm:text-2xl font-bold text-navy-900 leading-tight">{value}</h3>
              <p className="text-navy-600 text-sm truncate">{title}</p>
            </div>
            {description && (
              <p className="text-navy-500 text-xs mt-0.5 truncate">{description}</p>
            )}
          </div>
        </div>
        {trend && (
          <span className={`block mt-2 text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? '+' : '-'}{trend.value}%
          </span>
        )}
      </Card>
    )
 }