import { useState } from 'react'
import { Input } from '../../components/ui/Input'
import { STEM_CATEGORIES } from '../../config/stemCategories'

interface ProjectsFiltersProps {
  onFiltersChange: (filters: { search: string; technologies: string[]; categories: string[] }) => void
}

export const ProjectsFilters = ({ onFiltersChange }: ProjectsFiltersProps) => {
  const [search, setSearch] = useState('')
  const [technologies, setTechnologies] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    onFiltersChange({ search: e.target.value, technologies, categories })
  }

  const handleTechChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTech = e.target.value
    if (selectedTech && !technologies.includes(selectedTech)) {
      const newTechs = [...technologies, selectedTech]
      setTechnologies(newTechs)
      onFiltersChange({ search, technologies: newTechs, categories })
    }
  }

  const toggleCategory = (category: string) => {
    const newCategories = categories.includes(category)
      ? categories.filter(c => c !== category)
      : [...categories, category]
    setCategories(newCategories)
    onFiltersChange({ search, technologies, categories: newCategories })
  }

  const clearFilters = () => {
    setSearch('')
    setTechnologies([])
    setCategories([])
    onFiltersChange({ search: '', technologies: [], categories: [] })
  }

  const commonTechnologies = [
    'Biología',
    'Química',
    'Física',
    'Matemáticas',
    'Informática',
    'Tecnología',
    'Robótica',
    'Programación',
    'Electrónica',
    'IA',
  ]

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
          Categorías 
        </label>
        <div className="flex flex-wrap gap-2">
          {STEM_CATEGORIES.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                categories.includes(category)
                  ? 'bg-green-500 text-white'
                  : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
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
              {tech}
            </option>
          ))}
        </select>
        {technologies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {(search || technologies.length > 0 || categories.length > 0) && (
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
