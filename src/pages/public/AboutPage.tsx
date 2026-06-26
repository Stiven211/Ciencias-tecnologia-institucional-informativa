import { PublicLayout } from '../../components/layout/PublicLayout'
import { Card } from '../../components/ui/Card'
import { FlaskRound, Cpu, Leaf, Users } from 'lucide-react'

const values = [
  { icon: FlaskRound, label: 'Excelencia académica', description: 'Investigación rigurosa y métodos científicos' },
  { icon: Cpu, label: 'Innovación responsable', description: 'Tecnología al servicio de la educación' },
  { icon: Leaf, label: 'Sostenibilidad', description: 'Proyectos con impacto ambiental positivo' },
  { icon: Users, label: 'Colaboración', description: 'Trabajo interdisciplinario y colectivo' },
]

export const AboutPage = () => {
  return (
    <PublicLayout>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-navy-900 mb-4">Sobre Nosotros</h1>
          <p className="text-lg text-navy-600 max-w-2xl mx-auto">
            Área de Ciencias Naturales y Tecnología - Colegio José Celestino Mutis
          </p>
        </div>

        <div className="bg-white rounded-xl border border-navy-200 p-8 mb-8">
          <p className="text-navy-700 leading-relaxed mb-6">
            Somos una comunidad académica dedicada al avance de la ciencia y la tecnología
            a través de la investigación colaborativa y la innovación educativa.
          </p>
          <p className="text-navy-700 leading-relaxed">
            Nuestra plataforma conecta a profesores, investigadores y estudiantes para
            desarrollar proyectos que generen impacto real en nuestras comunidades.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card title="Nuestra Misión" className="bg-white">
            <p className="text-navy-600">
              Fomentar la excelencia académica y la innovación tecnológica proporcionando
              herramientas y recursos para el desarrollo de proyectos científicos y
              tecnológicos de alta calidad.
            </p>
          </Card>
          
          <Card title="Nuestra Visión" className="bg-white">
            <p className="text-navy-600">
              Ser el referente nacional en proyectos interdisciplinarios de ciencias
              naturales y tecnología, impulsando el desarrollo sostenible y la
              transformación digital educativa.
            </p>
          </Card>
        </div>

        <h2 className="text-2xl font-bold text-navy-900 mb-6">Valores Fundamentales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map((value) => {
            const Icon = value.icon
            return (
              <div key={value.label} className="bg-white rounded-xl border border-navy-200 p-6 hover:shadow-md transition-all duration-200">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                  <Icon size={20} className="text-blue-500" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-1">{value.label}</h3>
                <p className="text-xs text-navy-600">{value.description}</p>
              </div>
            )
          })}
        </div>
      </main>
    </PublicLayout>
  )
}

export default AboutPage