import { Link } from 'react-router-dom'
import { Edit, Trash2, BookOpen, FileText, Image } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import type { Publication } from '../../types'

interface PublicationCardProps {
  publication: Publication
  onDelete: (publication: Publication) => void
}

const typeIcons = {
  with_cover: Image,
  without_cover: FileText,
}

export const PublicationCard = ({ publication, onDelete }: PublicationCardProps) => {
  const { user } = useAuthStore()
  const isOwner = user?.id === publication.professor_id
  const canEdit = isOwner || user?.role === 'admin'
  const Icon = publication.cover_image ? typeIcons.with_cover : typeIcons.without_cover

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-navy-200 hover:shadow-md transition-shadow">
      {publication.cover_image && (
        <img 
          src={publication.cover_image} 
          alt={publication.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-navy-100 rounded-lg">
              <Icon size={20} className="text-navy-600" />
            </div>
            <h3 className="text-lg font-semibold text-navy-900 line-clamp-1">
              {publication.title}
            </h3>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            publication.published 
              ? 'bg-green-100 text-green-800' 
              : 'bg-navy-100 text-navy-800'
          }`}>
            {publication.published ? 'Publicado' : 'Borrador'}
          </span>
        </div>

        <p className="text-navy-600 text-sm mb-4 line-clamp-2">
          {publication.excerpt || 'Sin extracto'}
        </p>

        <div className="flex items-center justify-between text-sm text-navy-500">
          <span>{new Date(publication.created_at).toLocaleDateString('es-ES')}</span>

          {canEdit && (
            <div className="flex items-center space-x-2">
              <Link
                to={`/dashboard/publications/${publication.id}/edit`}
                className="p-1.5 rounded-lg hover:bg-navy-100 text-navy-600"
              >
                <Edit size={16} />
              </Link>
              <button
                onClick={() => onDelete(publication)}
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
