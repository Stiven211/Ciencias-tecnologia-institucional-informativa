export const PublicFooter = () => {
  return (
    <footer className="bg-navy-900 text-navy-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              Área de Ciencias
              <span className="text-green-400"> y Tecnología</span>
            </h3>
            <p className="text-navy-300">
              Impulsando la innovación científica y tecnológica desde la educación.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-navy-200">Enlaces rápidos</h4>
            <nav className="space-y-2">
              <a href="#" className="text-navy-300 hover:text-navy-100 transition-colors">
                Inicio
              </a>
              <a href="#" className="text-navy-300 hover:text-navy-100 transition-colors">
                Proyectos
              </a>
              <a href="#" className="text-navy-300 hover:text-navy-100 transition-colors">
                Profesores
              </a>
              <a href="#" className="text-navy-300 hover:text-navy-100 transition-colors">
                Acerca de
              </a>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-navy-200">Recursos</h4>
            <nav className="space-y-2">
              <a href="#" className="text-navy-300 hover:text-navy-100 transition-colors">
                Documentación 
              </a>
              <a href="#" className="text-navy-300 hover:text-navy-100 transition-colors">
                Tutoriales
              </a>
              <a href="#" className="text-navy-300 hover:text-navy-100 transition-colors">
                Publicaciones
              </a>
              <a href="#" className="text-navy-300 hover:text-navy-100 transition-colors">
                Eventos
              </a>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-navy-200">Contacto</h4>
            <p className="text-navy-300">
              Jose Celestino Mutis<br />
              Ciudad de Educación<br />
              info@cienciaotecnologia.edu
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-navy-800 text-navy-400 text-sm">
          <div className="flex justify-between sm:flex-col sm:items-center sm:gap-4">
            <span>© 2026 Área de Ciencias Naturales y Tecnología. Todos los derechos reservados.</span>
            <div className="flex space-x-4">
              <a href="#" className="text-navy-300 hover:text-navy-100 transition-colors">
                Privacidad
              </a>
              <a href="#" className="text-navy-300 hover:text-navy-100 transition-colors">
                Términos
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}