import { FolderOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const EmptyProjects = () => {
  const navigate = useNavigate()
  
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mb-4">
        <FolderOpen size={32} className="text-navy-400" />
      </div>
      <h3 className="text-lg font-semibold text-navy-900 mb-2">No hay proyectos</h3>
      <p className="text-navy-600 mb-6 max-w-sm">
        Aún no has creado ningún proyecto. Comienza creando tu primer proyecto académico.
      </p>
      <button
        onClick={() => {
          console.log('[EmptyProjects] navigate create project')
          navigate('/dashboard/projects/new')
        }}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
      >
        Crear primer proyecto
      </button>
    </div>
  )
}