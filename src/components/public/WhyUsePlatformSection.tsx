import { FolderOpen, Share2, Users, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: FolderOpen,
    title: 'Publica proyectos',
    description: 'Documenta y comparte tus investigaciones con la comunidad académica',
  },
  {
    icon: Share2,
    title: 'Comparte recursos',
    description: 'Bibliografía, herramientas y metodologías en un solo lugar',
  },
  {
    icon: Users,
    title: 'Colabora',
    description: 'Conecta con otros docentes para proyectos interdisciplinarios',
  },
  {
    icon: TrendingUp,
    title: 'Genera impacto',
    description: 'Tu investigación llega a estudiantes y académicos relevantes',
  },
]

export const WhyUsePlatformSection = () => {
  return (
    <section className="py-16 bg-navy-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-navy-900 mb-3">¿Por qué usar la plataforma?</h2>
          <p className="text-navy-600 max-w-2xl mx-auto">
            Herramientas diseñadas para investigadores y docentes del Área de Ciencias
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="bg-white rounded-xl p-6 border border-navy-200 hover:shadow-lg transition-all duration-200">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <Icon size={24} className="text-blue-500" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-navy-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}