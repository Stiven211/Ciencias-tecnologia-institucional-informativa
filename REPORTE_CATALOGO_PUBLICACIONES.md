# REPORTE_CATALOGO_PUBLICACIONES.md

## 1. Resumen

Se implementó el catálogo público de publicaciones, siguiendo el patrón de ProjectsCatalogPage / PublicProjectDetailPage:
- **Rutas públicas**: `/publicaciones` (lista) y `/publicaciones/:id` (detalle).
- **Navbar público**: se añadió el enlace "Publicaciones" en `PublicNavbar` y `publicNavigation`.
- **Servicio**: se extendió `publicService` con `getPublishedPublications()` y `getPublishedPublicationById(id)`, ambos con filtro `published=true` en el query.
- **Lista**: `PublicationsCatalogPage` con búsqueda local por título/excerpt, loading skeleton, empty state honesto y cards reutilizables.
- **Detalle**: `PublicPublicationDetailPage` con cover, excerpt, content, autor y fecha. Solo muestra publicaciones con `published=true`.
- **Home**: no se modificó (el bloque de featured no era trivial y el usuario indicó no tocar Home si complica).

No se tocaron SQL ni storage. No se habilitó catálogo de recursos.

---

## 2. Rutas + nav

### Rutas añadidas (`src/App.tsx`)

| Ruta | Componente | Protección |
|------|-----------|------------|
| `/publicaciones` | `PublicationsCatalogPage` | Pública |
| `/publicaciones/:id` | `PublicPublicationDetailPage` | Pública |

### Navbar público (`src/config/publicNavigation.ts`)

```ts
export const publicNavigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Proyectos', href: '/projects' },
  { name: 'Publicaciones', href: '/publicaciones' },
  { name: 'Acerca de', href: '/about' },
]
```

El enlace aparece en:
- `PublicNavbar` (desktop y mobile)
- No requiere autenticación.

---

## 3. Métodos publicService

### Añadidos en `src/services/public.service.ts`

```ts
async getPublishedPublications() {
  const { data, error } = await supabase
    .from('publications')
    .select(`
      *,
      professor:profiles(id, full_name, avatar_url)
    `)
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Publication[]
},

async getPublishedPublicationById(id: string) {
  const { data, error } = await supabase
    .from('publications')
    .select(`
      *,
      professor:profiles(id, full_name, avatar_url)
    `)
    .eq('id', id)
    .eq('published', true)
    .single()

  if (error) throw error
  return data as Publication
}
```

Ambos métodos:
- Filtran `published = true` **en el query**.
- Hacen join con `profiles(id, full_name, avatar_url)`.
- No exponen drafts aunque se adivine el ID.

---

## 4. Componentes públicos creados

### `PublicPublicationCard` (`src/components/public/PublicPublicationCard.tsx`)

- Muestra cover, título, extracto, fecha y autor.
- Enlace al detalle: `/publicaciones/:id`.
- Enlace al profesor: `/profesor/:id`.
- Estilo coherente con `PublicProjectCard`.

### `PublicationsCatalogPage` (`src/pages/public/PublicationsCatalogPage.tsx`)

- Layout: `PublicLayout`.
- Loading: skeleton grid (3 items).
- Búsqueda local por `title` y `excerpt`.
- Empty state: "No hay publicaciones publicadas aún" o mensaje de búsqueda sin resultados.
- Error state: mensaje en español.

### `PublicPublicationDetailPage` (`src/pages/public/PublicPublicationDetailPage.tsx`)

- Layout: `PublicLayout`.
- Loading: spinner centrado.
- Error: mensaje en español.
- Not-found: "Publicación no encontrada" si no existe o no está `published`.
- Muestra: cover, título, autor (avatar + nombre + link a perfil), fecha, extracto y contenido HTML.

---

## 5. Cómo probar

### Requisitos previos
- Tener publicaciones en la DB, algunas con `published=true` y otras con `published=false`.

### Flujo de prueba

1. **Navegación pública**
   - Ir a `/`.
   - Verificar que aparece "Publicaciones" en el navbar superior.
   - Click en "Publicaciones" y confirmar que dirige a `/publicaciones`.

2. **Lista de publicaciones**
   - Verificar que se muestran solo las publicaciones con `published=true`.
   - Verificar que el loading skeleton aparece brevemente.
   - Escribir en el buscador y confirmar que filtra por título/excerpt.
   - Verificar empty state cuando no hay publicaciones publicadas.

3. **Detalle de publicación**
   - Click en una publicación de la lista.
   - Verificar que se muestra: cover, título, autor (con avatar), fecha, extracto, contenido.
   - Verificar que el autor es linkeable a `/profesor/:id`.

4. **Draft NO visible**
   - Crear una publicación con `published=false` desde el dashboard.
   - Ir a `/publicaciones` y confirmar que NO aparece.
   - Ir a `/publicaciones/:id` (reemplazando `:id` por el ID del draft).
   - Confirmar que muestra "Publicación no encontrada" (el servicio filtra `published=true`).
   - Repetir con búsqueda: el draft no debe aparecer.

5. **Responsive**
   - Verificar que el navbar mobile muestra el enlace "Publicaciones".
   - Verificar que la grilla de publicaciones se adapta a móvil.

---

## 6. Resultado tsc

**Estado: OK — 0 errores**

```
npx tsc --noEmit
```

El comando terminó sin errores. No fue necesario corregir tipos, imports ni props.

---

## 7. Pendientes

- [ ] **Catálogo público de recursos**: queda fuera de esta tarea.
- [ ] **Featured publications en Home**: si se desea, crear un componente `FeaturedPublications` similar a `FeaturedProjects` e insertarlo en `HomePage`.
- [ ] **Paginación en catálogo público**: actualmente carga todas las publicaciones publicadas. Si crecen mucho, añadir paginación o infinite scroll.
- [ ] **Filtros avanzados**: filtrar por autor, rango de fechas, etc.
- [ ] **SEO**: añadir meta tags dinámicos por publicación (título, descripción, imagen).
