import { useState } from 'react'
import { Input } from '../../components/ui/Input'

interface ProjectsFiltersProps {
  onFiltersChange: (filters: { search: string; technologies: string[] }) => void
  initialFilters?: { search?: string; technologies?: string[] }
}

export const ProjectsFilters = ({ onFiltersChange, initialFilters }: ProjectsFiltersProps) => {
  const [search, setSearch] = useState(initialFilters?.search ?? '')
  const [technologies, setTechnologies] = useState<string[]>(initialFilters?.technologies ?? [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    onFiltersChange({ search: e.target.value, technologies })
  }

  const handleTechChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTech = e.target.value
    if (selectedTech && !technologies.includes(selectedTech)) {
      const newTechs = [...technologies, selectedTech]
      setTechnologies(newTechs)
      onFiltersChange({ search, technologies: newTechs })
    }
  }

  const removeTech = (tech: string) => {
    const newTechs = technologies.filter(t => t !== tech)
    setTechnologies(newTechs)
    onFiltersChange({ search, technologies: newTechs })
  }

  const clearFilters = () => {
    setSearch('')
    setTechnologies([])
    onFiltersChange({ search: '', technologies: [] })
  }

  const techDisplayNames: Record<string, string> = {
    informatica: 'Informática',
    quimica: 'Química',
    fisica: 'Física',
    matematicas: 'Matemáticas',
    biologia: 'Biología',
    tecnologia: 'Tecnología',
    robotica: 'Robótica',
    programacion: 'Programación',
    electronica: 'Electrónica',
    ia: 'IA',
  }

  const commonTechnologies = Object.keys(techDisplayNames)

  return (
    <div className="space-y-6">
        <Input
          label="Buscar proyectos"
          placeholder="Título, área, profesor..."
          value={search}
          onChange={handleSearchChange}
        />
       
      <div>
        <label className="block text-sm font-medium text-navy-700 mb-2">
          Filtrar por áreas temáticas
        </label>
        <select
          onChange={handleTechChange}
          className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Seleccionar área...</option>
          {commonTechnologies.map((tech) => (
            <option key={tech} value={tech}>
              {techDisplayNames[tech]}
            </option>
          ))}
        </select>
        {technologies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded flex items-center gap-1"
              >
                {techDisplayNames[tech] ?? tech}
                <button
                  type="button"
                  onClick={() => removeTech(tech)}
                  className="hover:text-green-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
       
      {(search || technologies.length > 0) && (
        <button
          onClick={clearFilters}
          className="w-full px-3 py-2 bg-navy-100 text-navy-700 rounded-lg hover:bg-navy-200"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
