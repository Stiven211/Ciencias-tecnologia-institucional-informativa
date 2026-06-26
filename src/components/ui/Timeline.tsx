import { BookOpen, Share2, FileText, User, Clock } from 'lucide-react'
import type { ReactNode } from 'react'

interface TimelineItem {
  id: string
  user: string
  action: string
  target: string
  time: string
  icon: ReactNode
  color: string
}

interface TimelineProps {
  items: TimelineItem[]
}

const actionIcons = {
  project: BookOpen,
  resource: Share2,
  publication: FileText,
  activity: Clock,
}

export const Timeline = ({ items }: TimelineProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-navy-500">
        <Clock size={24} className="mx-auto mb-2" />
        <p>No hay actividad reciente</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const Icon = actionIcons[item.icon as keyof typeof actionIcons] || User
        const isLast = index === items.length - 1
        return (
          <div key={item.id} className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
                <Icon size={18} className="text-white" />
              </div>
              {!isLast && (
                <div className="w-px h-8 bg-navy-200 mx-auto mt-2"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-navy-900">
                <span className="font-medium">{item.user}</span> {item.action}{' '}
                <span className="font-medium">{item.target}</span>
              </p>
              <p className="text-xs text-navy-500">{item.time}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}