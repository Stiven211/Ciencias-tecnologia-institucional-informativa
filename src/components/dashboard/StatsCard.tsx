import type { LucideIcon } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { Card } from '../ui/Card'

interface StatsCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    positive: boolean
  }
  description?: string
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
       <div className="flex items-center justify-between mb-4">
         <div className="p-3 bg-navy-50 rounded-xl">
           <Icon size={24} className="text-navy-600" />
         </div>
         {trend && (
           <span className={`text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
             {trend.positive ? '+' : '-'}{trend.value}%
           </span>
         )}
       </div>
       <h3 className="text-2xl font-bold text-navy-900">{value}</h3>
       <p className="text-navy-600 text-sm">{title}</p>
       {description && <p className="text-navy-500 text-xs mt-1">{description}</p>}
     </Card>
   )
 }