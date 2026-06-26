import { Link } from 'react-router-dom'

export const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-b from-navy-50 via-navy-50/50 to-white overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-navy-100 text-navy-700 mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Repositorio Académico y Científico
              </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy-900 mb-6">
              Área de Ciencias Naturales y Tecnología
              <br className="hidden sm:inline" />
              <span className="text-blue-500">Colegio José Celestino Mutis</span>
            </h1>
            <p className="text-lg text-navy-600 mb-8 max-w-xl">
              Plataforma institucional que reúne proyectos académicos y científicos 
              desarrollados por nuestros docentes en Biología, Química, Física, 
              Informática, Tecnología e Innovación.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/projects"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium"
              >
                Explorar Proyectos
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-6 py-3 border border-navy-300 text-navy-700 rounded-lg hover:bg-navy-50 transition-all duration-200 font-medium"
              >
                Conocer al Área
              </Link>
            </div>
          </div>
          
          <div className="relative h-80 lg:h-96">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="areas-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                
                <g className="animate-pulse" style={{ animationDuration: '10s' }}>
                  <circle cx="200" cy="200" r="120" stroke="url(#areas-gradient)" strokeWidth="1" fill="none" />
                  <circle cx="200" cy="200" r="80" stroke="url(#areas-gradient)" strokeWidth="1" fill="none" />
                  <circle cx="200" cy="200" r="40" stroke="url(#areas-gradient)" strokeWidth="1" fill="none" />
                </g>
              
              <g transform="translate(120, 120)">
                <path d="M0,0 L30,0 L30,30 L0,30 Z" stroke="#2563eb" strokeWidth="2" fill="none" className="opacity-60" />
                <circle cx="15" cy="15" r="3" fill="#2563eb" className="opacity-80" />
              </g>
              
              <g transform="translate(250, 250)">
                <path d="M0,0 L20,-10 L30,-30 L10,-20 Z" stroke="#ea580c" strokeWidth="2" fill="none" className="opacity-60" />
                <circle cx="15" cy="15" r="2" fill="#ea580c" className="opacity-80" />
              </g>
              
              <g transform="translate(100, 280)">
                <path d="M0,10 Q15,0 30,10 T60,10 T90,10" stroke="#22c55e" strokeWidth="2" fill="none" className="opacity-50" />
                <circle cx="0" cy="10" r="2" fill="#22c55e" />
                <circle cx="30" cy="10" r="2" fill="#22c55e" />
                <circle cx="60" cy="10" r="2" fill="#22c55e" />
                <circle cx="90" cy="10" r="2" fill="#22c55e" />
              </g>
              
              <g transform="translate(280, 100)">
                <rect x="0" y="0" width="40" height="25" rx="3" stroke="#6366f1" strokeWidth="2" fill="none" className="opacity-60" />
                <circle cx="8" cy="12" r="3" fill="#6366f1" />
                <rect x="16" y="8" width="18" height="2" fill="#6366f1" />
                <rect x="16" y="14" width="12" height="2" fill="#6366f1" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -bottom-20 -left-20 w-64 h-64 border border-navy-200/20 rounded-full"></div>
        <div className="absolute -top-20 -right-20 w-48 h-48 border border-blue-200/20 rounded-full"></div>
      </div>
    </section>
  )
}