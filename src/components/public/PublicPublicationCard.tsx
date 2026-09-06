import { Link } from 'react-router-dom'
import type { Publication } from '../../types'

interface PublicPublicationCardProps {
  publication: Publication
}

export const PublicPublicationCard = ({ publication }: PublicPublicationCardProps) => {
  return (
    <div className="group block hover:shadow-lg transition-shadow rounded-xl border border-navy-200 overflow-hidden">
      <Link to={`/publicaciones/${publication.id}`} className="block bg-white">
        {publication.cover_image && (
          <img
            src={publication.cover_image}
            alt={publication.title}
            className="w-full h-40 sm:h-48 object-cover"
          />
        )}
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-navy-900 mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
            {publication.title}
          </h3>
          <p className="text-sm text-navy-600 mb-3 sm:mb-4 line-clamp-3 leading-relaxed">
            {publication.excerpt || 'Sin extracto'}
          </p>
          <div className="pt-2 sm:pt-3 border-t border-navy-100">
            <span className="text-navy-500 text-xs sm:text-sm">
              {publication.published_at
                ? new Date(publication.published_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : new Date(publication.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
            </span>
          </div>
        </div>
      </Link>
      {publication.professor && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <Link 
            to={`/profesor/${publication.professor_id}`}
            className="inline-flex items-center space-x-2 text-sm text-navy-700 font-medium hover:text-green-600 transition-colors"
          >
            {publication.professor.avatar_url ? (
              <img
                src={publication.professor.avatar_url}
                alt={publication.professor.full_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center">
                <span className="text-navy-600 text-xs font-medium">
                  {publication.professor.full_name?.charAt(0)}
                </span>
              </div>
            )}
            <span>{publication.professor.full_name}</span>
          </Link>
        </div>
      )}
    </div>
  )
}
