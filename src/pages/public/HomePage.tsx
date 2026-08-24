import { useMemo, useState } from 'react'
import { ArrowUpRight, Beaker, BrainCircuit, ChevronRight, CirclePlay, FlaskConical, Menu, Search, Sparkles, X } from 'lucide-react'
import '../../App.css'

type Project = {
  title: string
  category: string
  description: string
  color: string
  metric: string
  icon: typeof Beaker
}

const projects: Project[] = [
  { title: 'Aire que cuenta', category: 'Ambiente', description: 'Sensores de bajo costo para leer la calidad del aire en tiempo real.', color: 'lime', metric: '94% precisión', icon: Beaker },
  { title: 'Mapa de memorias', category: 'Humanidades', description: 'Un archivo vivo que convierte relatos del barrio en cartografía colectiva.', color: 'coral', metric: '128 historias', icon: BrainCircuit },
  { title: 'Materia mínima', category: 'Física', description: 'Experimentos de energía y movimiento con objetos cotidianos.', color: 'violet', metric: '12 prototipos', icon: FlaskConical },
]

const categories = ['Todos', 'Ambiente', 'Humanidades', 'Física']

export const HomePage = () => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const matchesCategory = category === 'Todos' || project.category === category
    const text = `${project.title} ${project.description} ${project.category}`.toLowerCase()
    return matchesCategory && text.includes(query.toLowerCase())
  }), [category, query])

  return (
    <div className="nodo-app">
      <div className="grain" aria-hidden="true" />
      <header className="nodo-header">
        <a className="brand" href="/" aria-label="NODO Ciencia inicio">
          <span className="brand-mark"><span /></span>
          <span>NODO<span className="brand-accent">/</span>CIENCIA</span>
        </a>
        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'}>
          <a href="#explora" onClick={() => setMenuOpen(false)}>Explora</a>
          <a href="#metodo" onClick={() => setMenuOpen(false)}>El método</a>
          <a href="#comunidad" onClick={() => setMenuOpen(false)}>Comunidad</a>
          <a className="nav-login" href="/login">Ingresar <ArrowUpRight size={15} /></a>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <main>
        <section className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse-dot" /> Archivo abierto · 2026</div>
            <h1>Ideas que<br /><em>se vuelven</em><br />evidencia.</h1>
            <p className="hero-lede">Un espacio para descubrir, documentar y compartir los proyectos que están cambiando la forma de aprender ciencias.</p>
            <div className="hero-actions">
              <a className="button button-dark" href="#explora">Explorar proyectos <ArrowUpRight size={17} /></a>
              <a className="text-link" href="#metodo"><CirclePlay size={17} /> Conoce el método</a>
            </div>
          </div>
          <div className="hero-visual" aria-label="Visualización abstracta de conexiones científicas">
            <div className="orbit orbit-one"><span /></div>
            <div className="orbit orbit-two"><span /></div>
            <div className="visual-core"><Sparkles size={26} /><strong>01</strong><span>conectar<br />para entender</span></div>
            <div className="visual-note note-top">CURIOSIDAD<br /><b>→</b> MÉTODO</div>
            <div className="visual-note note-bottom">NODO_042<br /><b>ACTIVO</b></div>
          </div>
        </section>

        <section className="signal-strip" id="comunidad">
          <div><span className="strip-number">01</span><strong>Una red que aprende</strong></div>
          <div><span className="strip-number">02</span><strong>Procesos, no solo resultados</strong></div>
          <div><span className="strip-number">03</span><strong>Conocimiento compartido</strong></div>
        </section>

        <section className="explore-section" id="explora">
          <div className="section-heading"><div><span className="section-kicker">/ Proyectos destacados</span><h2>La ciencia<br /><em>en movimiento.</em></h2></div><p>Historias de estudiantes, profes y comunidades que convierten preguntas reales en experimentos con impacto.</p></div>
          <div className="catalog-tools">
            <div className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca una idea, un tema..." aria-label="Buscar proyectos" /></div>
            <div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
          </div>
          <div className="project-grid">
            {filteredProjects.map((project, index) => { const Icon = project.icon; return <article className={`project-card card-${project.color}`} key={project.title} onClick={() => setActiveProject(project)} tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && setActiveProject(project)}>
              <div className="card-top"><span className="card-index">0{index + 1} / 03</span><Icon size={22} /><ArrowUpRight className="card-arrow" size={18} /></div>
              <div className="card-illustration"><div className="illustration-lines" /><Icon size={54} strokeWidth={1.2} /></div>
              <span className="project-category">{project.category}</span><h3>{project.title}</h3><p>{project.description}</p><div className="card-footer"><span>{project.metric}</span><span>Ver proyecto <ChevronRight size={16} /></span></div>
            </article> })}
          </div>
          {filteredProjects.length === 0 && <div className="empty-results">No encontramos esa idea todavía. Prueba con otra palabra o categoría.</div>}
        </section>

        <section className="method-section" id="metodo"><div className="method-number">02</div><div className="method-copy"><span className="section-kicker">/ Nuestro enfoque</span><h2>Hacer visible<br /><em>el proceso.</em></h2><p>La innovación no ocurre en línea recta. NODO documenta las preguntas, los tropiezos y las pequeñas victorias que hacen que una idea avance.</p><a className="text-link" href="/about">Leer la historia completa <ArrowUpRight size={17} /></a></div><div className="method-quote">“La mejor pregunta<br />es la que abre<br /><span>otra pregunta.</span>”</div></section>

        <section className="join-section"><div><span className="section-kicker">/ Tu próximo nodo</span><h2>¿Qué estás<br /><em>investigando?</em></h2></div><div><p>Publica tu proyecto, encuentra colaboradores y deja que otras personas aprendan de tu recorrido.</p><a className="button button-lime" href="/register">Crear mi proyecto <ArrowUpRight size={17} /></a></div></section>
      </main>

      <footer className="nodo-footer"><div className="brand"><span className="brand-mark"><span /></span><span>NODO<span className="brand-accent">/</span>CIENCIA</span></div><span>Hecho para las preguntas que importan.</span><span>© 2026 · Área de Ciencias</span></footer>

      {activeProject && <div className="modal-backdrop" onClick={() => setActiveProject(null)}><div className="project-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setActiveProject(null)} aria-label="Cerrar"><X /></button><span className="section-kicker">/ Ficha de proyecto</span><h2>{activeProject.title}</h2><p>{activeProject.description}</p><div className="modal-meta"><span>{activeProject.category}</span><strong>{activeProject.metric}</strong></div><a className="button button-dark" href="/projects">Abrir catálogo <ArrowUpRight size={17} /></a></div></div>}
    </div>
  )
}

export default HomePage
