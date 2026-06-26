import { Link } from 'react-router-dom'

export const PublicFooter = () => {
  return (
    <footer className="bg-navy-900 text-navy-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-navy-100">Área de Ciencias</span>
              <span className="text-blue-400"> Naturales y Tecnología</span>
            </h3>
            <p className="text-navy-300 text-sm">
              Colegio José Celestino Mutis
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-navy-200">Navegación</h4>
            <nav className="space-y-2">
              <Link to="/" className="block text-navy-300 hover:text-navy-100 transition-colors text-sm">
                Inicio
              </Link>
              <Link to="/projects" className="block text-navy-300 hover:text-navy-100 transition-colors text-sm">
                Proyectos
              </Link>
              <Link to="/about" className="block text-navy-300 hover:text-navy-100 transition-colors text-sm">
                Acerca de
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-navy-200">Áreas</h4>
            <nav className="space-y-2">
              <span className="block text-navy-300 text-sm">Biología</span>
              <span className="block text-navy-300 text-sm">Química</span>
              <span className="block text-navy-300 text-sm">Física</span>
              <span className="block text-navy-300 text-sm">Informática</span>
              <span className="block text-navy-300 text-sm">Tecnología</span>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-navy-200">Contacto</h4>
            <p className="text-navy-300 text-sm">
              Colegio José Celestino Mutis<br />
              San Jose Del Guaviare, Colombia<br />
              info@cienciaotecnologia.edu
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-navy-800 text-navy-400 text-sm">
          <span>© 2026 Área de Ciencias Naturales y Tecnología. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  )
}