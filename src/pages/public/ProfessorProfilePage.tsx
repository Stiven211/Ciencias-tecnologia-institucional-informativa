import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { PublicLayout } from '../../components/layout/PublicLayout'
import type { Profile, Project, Publication } from '../../types'

export const ProfessorProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [{ data: profileData }, { data: projectsData }, { data: pubsData }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', id).single(),
          supabase.from('projects').select('*').eq('professor_id', id).eq('status', 'published'),
          supabase.from('publications').select('*').eq('professor_id', id),
        ])

        setProfile(profileData)
        setProjects(projectsData || [])
        setPublications(pubsData || [])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  return (
    <PublicLayout>
      {loading && (
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-96 w-full bg-navy-50 rounded-lg"></div>
          </div>
        </main>
      )}
      {!profile && !loading && (
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
          <div className="text-center text-navy-500">Profesor no encontrado</div>
        </main>
      )}
      {profile && !loading && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-start space-x-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-green-500 flex items-center justify-center text-white text-4xl font-bold">
                {profile.full_name.charAt(0)}
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-navy-900">{profile.full_name}</h1>
              <p className="text-navy-600 mt-1 capitalize">{profile.role}</p>
              
              {profile.specialization && (
                <div className="mt-3">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {profile.specialization}
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-navy-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-navy-900">{projects.length}</div>
                  <div className="text-sm text-navy-600">Proyectos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-navy-900">{publications.length}</div>
                  <div className="text-sm text-navy-600">Publicaciones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-navy-900">{projects.reduce((sum, p) => sum + (p.technologies?.length || 0), 0)}</div>
                  <div className="text-sm text-navy-600">Tecnologías</div>
                </div>
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className="mt-6 pt-6 border-t border-navy-200">
              <h2 className="text-lg font-semibold text-navy-900 mb-2">Biografía</h2>
              <p className="text-navy-700">{profile.bio}</p>
            </div>
          )}
        </div>

        {projects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Proyectos Publicados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(project => (
                <div key={project.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-navy-200 hover:shadow-md transition-shadow">
                  {project.cover_image && (
                    <img src={project.cover_image} alt={project.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-navy-900 mb-2">{project.title}</h3>
                    {project.categories && project.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.categories.slice(0, 2).map((cat, i) => (
                          <span key={i} className="text-xs bg-navy-100 text-navy-700 px-2 py-0.5 rounded">{cat}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-navy-600 mt-1 line-clamp-2">
                      {project.description || 'Sin descripción'}
                    </p>
                    <Link
                      to={`/projects/${project.slug}`}
                      className="inline-block mt-3 text-sm text-green-600 font-medium hover:text-green-700"
                    >
                      Ver proyecto →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </main>
      )}
    </PublicLayout>
  )
}