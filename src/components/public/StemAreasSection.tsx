import { FlaskRound, Atom, Cpu, Code, Bot, Calculator } from 'lucide-react'

const stemAreas = [
  { name: 'Química', icon: FlaskRound, color: 'bg-orange-100 text-orange-600' },
  { name: 'Biología', icon: Atom, color: 'bg-green-100 text-green-600' },
  { name: 'Física', icon: Calculator, color: 'bg-blue-100 text-blue-600' },
  { name: 'Tecnología', icon: Cpu, color: 'bg-indigo-100 text-indigo-600' },
  { name: 'Informática', icon: Code, color: 'bg-blue-100 text-blue-600' },
  { name: 'Robótica', icon: Bot, color: 'bg-orange-100 text-orange-600' },
]

export const StemAreasSection = () => {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-navy-900 mb-3">Áreas</h2>
          <p className="text-navy-600 max-w-2xl mx-auto">
            Explora proyectos organizados por disciplina científica
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stemAreas.map((area) => {
            const Icon = area.icon
            return (
              <div key={area.name} className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-navy-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${area.color}`}>
                  <Icon size={24} />
                </div>
                <span className="text-sm font-medium text-navy-700">{area.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}