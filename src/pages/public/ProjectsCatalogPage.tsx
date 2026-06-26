import { useState } from 'react'
import { ProjectsFilters } from '../../components/public/ProjectsFilters'
import { PublicProjectsGrid } from '../../components/public/PublicProjectsGrid'
import { PublicLayout } from '../../components/layout/PublicLayout'

export const ProjectsCatalogPage = () => {
  const [filters, setFilters] = useState<{ search: string; technologies: string[]; categories: string[] }>({
    search: '',
    technologies: [],
    categories: []
  })

  return (
    <PublicLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900">
            Repositorio de Proyectos
          </h1>
          <p className="text-navy-600 mt-2">
            Proyectos académicos del Área de Ciencias Naturales y Tecnología
          </p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ProjectsFilters onFiltersChange={setFilters} />
          </div>
          <div className="lg:col-span-2">
            <PublicProjectsGrid filters={filters} />
          </div>
        </div>
      </main>
    </PublicLayout>
  )
}