# REPORTE_STATS_Y_STORAGE.md

## 1. Resumen

Se ejecutaron tres líneas de trabajo dentro de las restricciones indicadas:
- **Dashboard stats honestas**: se eliminó la tarjeta "Visualizaciones" que usaba un cálculo falso (`projectsCount * 150`) y se limpiaron estados vacíos inconsistentes.
- **publicService**: se añadió `getPublishedProjectsByProfessor(professorId)` con filtro `status='published'` en el query, y `ProfessorProfilePage` dejó de filtrar por cliente.
- **Inventario de storage**: se revisaron los 3 buckets objetivo (`projects`, `resources`, `publications`) sin ejecutar ni escribir SQL de políticas.

---

## 2. Stats (antes / después)

### Antes
- `useDashboardStats.ts` calculaba `views: \`${Math.floor(projectsCount.count * 150)}k\`` (placeholder sin tabla de analytics).
- `DashboardStatsGrid.tsx` mostraba 4 tarjetas, incluyendo "Visualizaciones" con `0k` en fallback.
- Estados vacíos: algunos componentes mostraban `0k` o valores heredados del fallback.

### Después
- **`useDashboardStats.ts`** (src/hooks/useDashboardStats.ts):
  - Eliminado `views` de la interfaz `DashboardStats`.
  - Eliminada la cuarta consulta `viewsCount` del `Promise.all`.
  - `setStats` solo devuelve `projects`, `resources`, `collaborators`.

- **`DashboardStatsGrid.tsx`** (src/components/dashboard/DashboardStatsGrid.tsx):
  - Eliminada la tarjeta "Visualizaciones" de `fallbackStats` y del render condicional.
  - Grilla cambiada de `lg:grid-cols-4` a `lg:grid-cols-3`.
  - Esqueleto de carga ajustado a 3 columnas en lugar de 4.

- **Empty states honestos verificados**:
  - `ProfessorProfilePage`: "Sin proyectos publicados" (texto honesto, sin ceros ni undefined).
  - `RecentActivity`: "No hay actividad reciente".
  - `UpcomingTasks`: "No hay tareas próximas".
  - `EmptyProjects`: "No hay proyectos" + CTA a crear.
  - `PublicProjectsGrid`: "No se encontraron proyectos con los filtros aplicados".
  - `FeaturedProjects`: "Próximamente se publicarán proyectos destacados".

---

## 3. publicService

### Cambio realizado
Se añadió el método en `src/services/public.service.ts`:

```ts
async getPublishedProjectsByProfessor(professorId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      professor:profiles(id, full_name, avatar_url)
    `)
    .eq('professor_id', professorId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Project[]
}
```

### Actualización en página
`ProfessorProfilePage` (src/pages/public/ProfessorProfilePage.tsx):
- **Antes**: importaba `projectsService`, llamaba `getProjectsByProfessor(id)` y aplicaba `.filter(p => p.status === 'published')` en el cliente.
- **Después**: importa `publicService`, llama `getPublishedProjectsByProfessor(id)` y asigna `projectsData` directamente sin filtrado client-side.

Cumple la restricción: no hay `supabase.from` en páginas o componentes.

---

## 4. Inventario de 3 buckets (tabla)

| Bucket | ¿Existe upload en código? | Path actual en código | Política actual (DB) | ¿Seguro aplicar [1]+admin? |
|--------|---------------------------|----------------------|---------------------|---------------------------|
| `projects` | **No** | **No definido** (no hay código de upload) | SELECT público. INSERT/UPDATE/DELETE: solo `teacher/admin`, **sin** `storage.foldername(name)[1] = auth.uid()` | **No** |
| `resources` | **No** | **No definido** (no hay código de upload) | SELECT público. INSERT/UPDATE/DELETE: solo `teacher/admin`, **sin** `storage.foldername(name)[1] = auth.uid()` | **No** |
| `publications` | **No** | **No definido** (no hay código de upload) | SELECT público. INSERT/UPDATE/DELETE: solo `teacher/admin`, **sin** `storage.foldername(name)[1] = auth.uid()` | **No** |

### Detalle de uploads existentes (para contexto)
Los únicos uploads activos en el frontend son:

| Bucket | Archivo | Path |
|--------|---------|------|
| `avatars` | `src/components/ui/AvatarUpload.tsx` | `{user.id}/{user.id}-avatar-{ts}.{ext}` |
| `covers` | `src/services/projects.service.ts` (`uploadCoverImage`) | `covers/{userId}/{fileName}` |
| `gallery` | `src/services/projects.service.ts` (`uploadGalleryImage`) | `gallery/{userId}/{fileName}` |

Los 3 buckets objetivo (`projects`, `resources`, `publications`) están **creados** en `supabase/storage.sql` pero **sin código de subida** en el frontend.  
Las políticas actuales en `storage.sql` incluyen comentarios explícitos:
> "PENDIENTE: las políticas actuales de este bucket en la DB no siguen necesariamente la convención [1] = auth.uid()... Alinear {bucket} queda fuera del alcance de esta tarea."

---

## 5. Recomendación: ¿próximo prompt es endurecer storage o empezar CRUD?

**Empezar CRUD primero.**

Motivos:
1. No existe ningún código de upload para `projects`, `resources` ni `publications`. Endurecer las políticas sin haber establecido una convención de paths en código generaría fricción o bloqueos innecesarios.
2. Los buckets ya existen y tienen políticas laxas (solo rol). Es funcional mientras no haya uploads.
3. El paso correcto es: **implementar los uploads** con path `{userId}/...` en los servicios correspondientes, **verificar** que los archivos lleguen con esa estructura, y **después** endurecer las políticas con `storage.foldername(name)[1] = auth.uid()` + admin.

Endurecer storage ahora sería prematuro y podría romper flujos futuros.

---

## 6. Pendientes

- [ ] Implementar uploads reales en `projects`, `resources` y `publications` (frontend) con path `{userId}/...`.
- [ ] Una vez los uploads estén en código y verificado el path, endurecer políticas de esos 3 buckets con `storage.foldername(name)[1] = auth.uid()` y admin override.
- [ ] Corregir bug en migración `20260902191500_harden_storage_ownership.sql`: usa `storage.foldername(name)[0]` (0-based) pero Postgres es 1-based; debería ser `[1]`.
- [ ] Revisar si `FeaturedProjects` necesita manejar `professor.full_name` undefined en línea 87 (`charAt(0)` sin safe check).
- [ ] Considerar si `DashboardStatsGrid` en estado de carga debe mostrar 3 o 4 esqueletos según diseño final (actualmente ajustado a 3).
