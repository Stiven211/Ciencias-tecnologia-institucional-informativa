# NODO / CIENCIA

**NODO / CIENCIA** es el nuevo portal público del Área de Ciencias: una experiencia editorial para descubrir proyectos, documentar procesos de investigación y conectar a estudiantes, docentes y comunidades.

## Qué incluye

La portada presenta una identidad visual propia, inspirada en cuadernos de laboratorio, diagramas de conexiones y señalética de archivo. La experiencia incluye un hero editorial, navegación responsive, catálogo de proyectos destacados, búsqueda local, filtros por disciplina, modal de detalle y llamadas a la acción hacia el catálogo, registro y método institucional.

El diseño utiliza una composición asimétrica, fondo papel, tinta carbón y acentos ácido-lima, coral y violeta. Se incorporan estados de foco visibles, navegación por teclado en las tarjetas, soporte para `prefers-reduced-motion` y un menú móvil.

## Stack

| Parte | Tecnología |
| --- | --- |
| UI | React 19 + TypeScript |
| Bundler | Vite 8 |
| Iconografía | lucide-react |
| Estilos | CSS modular dentro de `src/App.css` + Tailwind base |
| Rutas existentes | React Router |
| Backend existente | Supabase, conservado para autenticación y dashboard |

## Desarrollo local

```bash
npm install
npm run dev
```

Vite utiliza el puerto `9988` en este repositorio. La compilación de producción se valida con:

```bash
npm run build
```

El comando `npm run lint` permite revisar la calidad estática del código.

## Estructura relevante

`src/pages/public/HomePage.tsx` contiene la experiencia pública principal de NODO / CIENCIA. `src/App.css` contiene el sistema visual de la portada: tipografía, layout, color, tarjetas, modal y breakpoints responsive. Las rutas de autenticación, catálogo, perfiles y dashboard existentes se mantienen para que la evolución visual no rompa el flujo institucional ya construido.

## Despliegue en Vercel

El proyecto es una aplicación Vite estática. En Vercel se debe importar este repositorio usando los siguientes valores:

| Configuración | Valor |
| --- | --- |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |

Si se habilita Supabase en el entorno publicado, hay que configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en las variables de entorno de Vercel. La portada pública funciona sin esas variables porque sus proyectos destacados son datos de demostración locales; los flujos autenticados sí dependen de la configuración existente de Supabase.

## Decisiones de producto

La propuesta prioriza el **proceso científico** sobre un listado institucional genérico. Cada tarjeta comunica una disciplina, una historia y una métrica corta para que la exploración sea visual y rápida. El contenido de ejemplo está escrito en español y puede sustituirse desde los servicios de proyectos ya presentes en `src/services/`.

## Autoría

Construido por **Manus AI** para el repositorio `Stiven211/Ciencias-tecnologia-institucional-informativa`.
