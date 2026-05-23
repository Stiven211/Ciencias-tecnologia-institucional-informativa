import { Link } from 'react-router-dom'

export const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-b from-navy-50 via-navy-100 to-white">
      <div className="relative z-10 pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-navy-900 sm:text-5xl mb-6">
            Impulsando la innovación científica
            <br className="hidden sm:inline" /> y tecnológica desde la educación
          </h1>
          <p className="text-navy-600 text-lg mb-8 max-w-2xl mx-auto">
            Plataforma institucional que conecta a profesores, investigadores y estudiantes
            en el desarrollo de proyectos innovadores de ciencias naturales y tecnología.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/projects"
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium sm:px-8 sm:py-4"
            >
              Explorar Proyectos
            </Link>
            <Link
              to="/about"
              className="flex items-center justify-center px-6 py-3 border border-navy-300 text-navy-700 rounded-lg hover:bg-navy-50 transition-colors font-medium sm:px-8 sm:py-4"
            >
              Conocernos
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-40 h-40 bg-green-500/10 rounded-full"></div>
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-32 h-32 bg-navy-50/50 rounded-full"></div>
      </div>
    </section>
  )
}