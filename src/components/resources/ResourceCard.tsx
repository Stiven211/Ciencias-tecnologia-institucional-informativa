import { Link } from 'react-router-dom'
import { Edit, Trash2, FileText, Link2, Image, Video, Paperclip } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import type { Resource } from '../../types'

interface ResourceCardProps {
  resource: Resource
  onDelete: (resource: Resource) => void
}

const typeIcons = {
  document: FileText,
  video: Video,
  link: Link2,
  image: Image,
}

const typeLabels = {
  document: 'Documento',
  video: 'Video',
  link: 'Enlace',
  image: 'Imagen',
}

const typeColors = {
  document: 'bg-blue-100 text-blue-800',
  video: 'bg-purple-100 text-purple-800',
  link: 'bg-green-100 text-green-800',
  image: 'bg-orange-100 text-orange-800',
}

export const ResourceCard = ({ resource, onDelete }: ResourceCardProps) => {
  const { user } = useAuthStore()
  const isOwner = user?.id === resource.professor_id
  const canEdit = isOwner || user?.role === 'admin'
  const Icon = typeIcons[resource.type] || Paperclip

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-navy-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-navy-100 rounded-lg">
              <Icon size={20} className="text-navy-600" />
            </div>
            <h3 className="text-lg font-semibold text-navy-900 line-clamp-1">
              {resource.title}
            </h3>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${typeColors[resource.type]}`}>
            {typeLabels[resource.type]}
          </span>
        </div>

        <p className="text-navy-600 text-sm mb-4 line-clamp-2">
          {resource.description || 'Sin descripción'}
        </p>

        <div className="flex items-center justify-between text-sm text-navy-500">
          <span>{new Date(resource.created_at).toLocaleDateString('es-ES')}</span>

          {canEdit && (
            <div className="flex items-center space-x-2">
              <Link
                to={`/dashboard/resources/${resource.id}/edit`}
                className="p-1.5 rounded-lg hover:bg-navy-100 text-navy-600"
              >
                <Edit size={16} />
              </Link>
              <button
                onClick={() => onDelete(resource)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
