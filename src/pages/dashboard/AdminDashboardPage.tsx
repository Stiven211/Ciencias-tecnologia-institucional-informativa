import { useEffect, useState } from 'react'
import { Shield, Users, FolderOpen, BookOpen, FileText, Search } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { LoadingSpinnerCentered } from '../../components/ui/LoadingSpinner'
import { Pagination } from '../../components/ui/Pagination'
import { Input } from '../../components/ui/Input'
import type { Profile, Project, UserRole } from '../../types'

type AdminTab = 'professors' | 'projects' | 'publications' | 'resources'

export const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('professors')
  const [professors, setProfessors] = useState<Profile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (activeTab === 'professors') {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
          
          if (!error && data) setProfessors(data)
        } else if (activeTab === 'projects') {
          const { data, error } = await supabase
            .from('projects')
            .select(`*, professor:profiles(full_name, email)`)
            .order('created_at', { ascending: false })
            .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
          
          if (!error && data) setProjects(data)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTab, currentPage, searchTerm])

const updateProfessorRole = async (id: string, role: UserRole) => {
     await supabase.from('profiles').update({ role }).eq('id', id)
     setProfessors(prev => prev.map(p => p.id === id ? { ...p, role } : p))
   }

   const updateProjectStatus = async (id: string, status: 'draft' | 'published' | 'archived') => {
     await supabase.from('projects').update({ status }).eq('id', id)
     setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p))
   }

  if (loading) return <LoadingSpinnerCentered text="Cargando panel de administración..." />

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Shield className="text-red-600 mr-3" size={32} />
        <h1 className="text-2xl font-bold text-navy-900">Panel de Administración</h1>
      </div>

      <div className="border-b border-navy-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'professors', label: 'Profesores', icon: Users },
            { id: 'projects', label: 'Proyectos', icon: FolderOpen },
            { id: 'publications', label: 'Publicaciones', icon: BookOpen },
            { id: 'resources', label: 'Recursos', icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-navy-500 hover:text-navy-700'
              }`}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mb-4">
        <Input
          icon={<Search size={20} />}
          placeholder={`Buscar ${activeTab === 'professors' ? 'profesores' : activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-64"
        />
      </div>

      {activeTab === 'professors' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-navy-200">
            <thead className="bg-navy-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-200">
              {professors.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-4 text-sm font-medium text-navy-900">{p.full_name}</td>
                  <td className="px-6 py-4 text-sm text-navy-600">{p.email}</td>
                  <td className="px-6 py-4">
<select
                       value={p.role}
                       onChange={(e) => updateProfessorRole(p.id, e.target.value as UserRole)}
                       className="text-sm border border-navy-300 rounded px-2 py-1"
                     >
                      <option value="visitor">Visitante</option>
                      <option value="teacher">Profesor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-red-600 hover:text-red-800">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-navy-200">
            <thead className="bg-navy-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase">Autor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-200">
              {projects.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-4 text-sm font-medium text-navy-900">{p.title}</td>
                  <td className="px-6 py-4 text-sm text-navy-600">{p.professor?.full_name || 'N/A'}</td>
                  <td className="px-6 py-4">
<select
                       value={p.status}
                       onChange={(e) => updateProjectStatus(p.id, e.target.value as 'draft' | 'published' | 'archived')}
                       className="text-sm border border-navy-300 rounded px-2 py-1"
                     >
                      <option value="draft">Borrador</option>
                      <option value="published">Publicado</option>
                      <option value="archived">Archivado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button className="text-red-600 hover:text-red-800">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={10}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}