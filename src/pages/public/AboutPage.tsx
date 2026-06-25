import { PublicLayout } from '../../components/layout/PublicLayout'

export const AboutPage = () => {
  return (
    <PublicLayout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-navy-900 mb-8">
          Sobre Nosotros
        </h1>
        <div className="prose prose-navy max-w-none">
          <p className="mb-6">
            Somos una comunidad académica dedicada al avance de la ciencia y la tecnología
            a través de la investigación colaborativa y la innovación educativa.
          </p>
          <p className="mb-6">
            Nuestra plataforma conecta a profesores, investigadores y estudiantes para
            desarrollar proyectos que generen impacto real en nuestras comunidades.
          </p>
          <h2 className="text-2xl font-semibold text-navy-900 mb-4">
            Nuestra Misión
          </h2>
          <p className="mb-6">
            Fomentar la excelencia académica y la innovación tecnológica proporcionando
            herramientas y recursos para el desarrollo de proyectos científicos y
            tecnológicos de alta calidad.
          </p>
          <h2 className="text-2xl font-semibold text-navy-900 mb-4">
            Nuestra Visión
          </h2>
          <p className="mb-6">
            Ser el referente nacional en proyectos interdisciplinarios de ciencias
            naturales y tecnología, impulsando el desarrollo sostenible y la
            transformación digital educativa.
          </p>
          <h2 className="text-2xl font-semibold text-navy-900 mb-4">
            Valores Fundamentales
          </h2>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Excelencia académica</li>
            <li>Innovación responsable</li>
            <li>Colaboración interdisciplinaria</li>
            <li>Impacto social</li>
            <li>Sostenibilidad ambiental</li>
          </ul>
        </div>
      </main>
    </PublicLayout>
  )
}

export default AboutPage