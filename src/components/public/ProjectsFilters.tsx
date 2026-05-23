import { useState } from 'react'

interface ProjectsFiltersProps {
  onFiltersChange: (filters: { search: string; technologies: string[] }) => void
}

export const ProjectsFilters = ({ onFiltersChange }: ProjectsFiltersProps) => {
  const [search, setSearch] = useState('')
  const [technologies, setTechnologies] = useState<string[]>([])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    onFiltersChange({ search: e.target.value, technologies })
  }

  const handleTechChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTech = e.target.value
    if (selectedTech) {
      setTechnologies(prev => [...prev, selectedTech])
    } else {
      setTechnologies([])
    }
    onFiltersChange({ search, technologies: [...technologies] })
  }

  const clearFilters = () => {
    setSearch('')
    setTechnologies([])
    onFiltersChange({ search: '', technologies: [] })
  }

  // Common technologies for demo - in a real app, these would come from the database
  const commonTechnologies = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 
    'Java', 'C++', 'MATLAB', 'LabVIEW', 'SolidWorks',
    'Arduino', 'Raspberry Pi', 'TensorFlow', 'PyTorch', 'AWS'
  ]

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-navy-700 mb-2">
          Buscar proyectos
        </label>
        <input
          type="text"
          placeholder="Título, tecnologías, profesor..."
          value={search}
          onChange={handleSearchChange}
          className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-navy-700 mb-2">
          Filtrar por tecnologías
        </label>
        <select
          onChange={handleTechChange}
          className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Seleccionar tecnología...</option>
          {commonTechnologies.map((tech) => (
            <option key={tech} value={tech}>
              {tech}
            </option>
          ))}
        </select>
        {technologies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {technologies.map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded flex items-center"
              >
                {tech}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setTechnologies(technologies.filter((t) => t !== tech))
                    onFiltersChange({ search, technologies: technologies.filter((t) => t !== tech) })
                  }}
                  className="ml-2 text-navy-500 hover:text-navy-700"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="mt-2 px-3 py-1 bg-navy-50 text-navy-600 hover:bg-navy-100 rounded text-xs"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  )
}