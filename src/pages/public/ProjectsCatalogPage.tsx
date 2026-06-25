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
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy-900">
              Proyectos Académicos
            </h2>
            <p className="text-navy-600 max-w-2xl mx-auto">
              Explora nuestro catálogo de proyectos científicos y tecnológicos
              desarrollados por nuestra comunidad académica.
            </p>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-3 lg:grid-rows-2">
            <ProjectsFilters onFiltersChange={setFilters} />
            <div className="lg:col-span-2">
              <PublicProjectsGrid filters={filters} />
            </div>
          </div>
        </div>
      </main>
    </PublicLayout>
  )
}