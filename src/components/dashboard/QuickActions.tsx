import { FileText, Upload, UserPlus, BookPlus } from 'lucide-react'
import { Card } from '../ui/Card'

const actions = [
  { name: 'Crear curso', icon: BookPlus, color: 'bg-green-500' },
  { name: 'Subir recurso', icon: Upload, color: 'bg-cyan-500' },
  { name: 'Nueva actividad', icon: FileText, color: 'bg-orange-400' },
  { name: 'Gestionar usuarios', icon: UserPlus, color: 'bg-navy-700' },
]

export const QuickActions = () => {
  return (
    <Card title="Accesos rápidos">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.name}
            className="flex flex-col items-center p-4 rounded-xl border border-navy-200 hover:bg-navy-50 transition-colors"
          >
            <div className={`p-2 ${action.color} rounded-lg mb-2`}>
              <action.icon size={20} className="text-white" />
            </div>
            <span className="text-sm text-navy-700">{action.name}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}