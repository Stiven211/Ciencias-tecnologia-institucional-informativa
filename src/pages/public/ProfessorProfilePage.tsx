import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { PublicLayout } from '../../components/layout/PublicLayout'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton'
import { BookOpen } from 'lucide-react'
import type { Profile, Project } from '../../types'

export const ProfessorProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [{ data: profileData }, { data: projectsData }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', id).single(),
          supabase.from('projects').select('*').eq('professor_id', id).eq('status', 'published'),
        ])

        setProfile(profileData)
        setProjects(projectsData || [])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <PublicLayout>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton height="200px" className="mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </main>
      </PublicLayout>
    )
  }

  if (!profile) {
    return (
      <PublicLayout>
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <EmptyState
            icon={<BookOpen size={32} className="text-navy-400" />}
            title="Profesor no encontrado"
            description="El perfil solicitado no existe o no está disponible."
          />
        </main>
      </PublicLayout>
    )
  }

  const allAreas = projects.flatMap(p => p.technologies || [])
  const areaCounts = allAreas.reduce((acc: Record<string, number>, area) => {
    acc[area] = (acc[area] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topAreas = Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <PublicLayout>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-xl border border-navy-200 p-5 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-6">
            <div className="flex-shrink-0 mb-4 sm:mb-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-navy-100"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 text-2xl sm:text-3xl font-semibold">
                  {profile.full_name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-navy-900">{profile.full_name}</h1>
              <p className="text-navy-600 mt-1 capitalize text-sm sm:text-base">{profile.role}</p>

              {profile.specialization && (
                <span className="inline-block mt-3 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs sm:text-sm font-medium">
                  {profile.specialization}
                </span>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-navy-200">
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-navy-900">{projects.length}</div>
                  <div className="text-xs text-navy-600">Proyectos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-navy-900">{topAreas.length}</div>
                  <div className="text-xs text-navy-600">Áreas</div>
                </div>
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-navy-200">
              <p className="text-navy-700 leading-relaxed text-sm sm:text-base">{profile.bio}</p>
            </div>
          )}
        </div>

        {topAreas.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-navy-900 mb-3 sm:mb-4">Áreas de especialización</h2>
            <div className="flex flex-wrap gap-2">
              {topAreas.map(([area, count]) => (
                <span key={area} className="px-3 py-1.5 bg-navy-100 text-navy-700 text-xs sm:text-sm rounded-full">
                  {area} <span className="text-navy-500">({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg sm:text-xl font-bold text-navy-900 mb-4 sm:mb-6">Proyectos publicados</h2>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {projects.map(project => (
              <article key={project.id} className="bg-white rounded-xl border border-navy-200 overflow-hidden hover:shadow-md transition-all duration-200">
                {project.cover_image && (
                  <img src={project.cover_image} alt={project.title} className="w-full h-40 sm:h-44 object-cover" />
                )}
                <div className="p-4 sm:p-5">
                  <h3 className="font-semibold text-navy-900 mb-2 text-sm sm:text-base">{project.title}</h3>
                  {project.categories && project.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {project.categories.slice(0, 2).map((cat, i) => (
                        <span key={i} className="text-xs bg-navy-100 text-navy-700 px-2 py-0.5 rounded">{cat}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-navy-600 line-clamp-2 mb-3">
                    {project.description || 'Sin descripción'}
                  </p>
                  <Link
                    to={`/projects/${project.slug}`}
                    className="text-sm text-green-600 font-medium hover:text-green-700"
                  >
                    Ver proyecto →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen size={32} className="text-navy-400" />}
            title="Sin proyectos publicados"
            description="Este profesor aún no ha publicado proyectos en el repositorio."
          />
        )}
      </main>
    </PublicLayout>
  )
}
