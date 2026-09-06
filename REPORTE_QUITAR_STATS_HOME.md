# REPORTE_QUITAR_STATS_HOME.md

## 1. Qué se dejó de renderizar

Se eliminó la sección de contadores públicos del Home:
- **Antes**: `HomePage` renderizaba `<PublicStats />`, que mostraba 4 cards con contadores de Proyectos / Profesores / Recursos / Publicaciones.
- **Después**: `HomePage` ya no monta `PublicStats`. El Home queda con: Hero → StemAreas → FeaturedProjects.

No queda ningún `<section className="py-12">` vacío ni franja verde residual.

---

## 2. Archivos borrados o editados

### Editados
- `src/pages/public/HomePage.tsx`
  - Eliminado import de `PublicStats`.
  - Eliminado `<PublicStats />` del JSX.

### Borrados
- `src/components/public/PublicStats.tsx` (componente entero).

### Editados (código muerto asociado)
- `src/services/public.service.ts`
  - Eliminado método `getPublicStats()` (ya no es llamado desde ningún componente).

---

## 3. tsc

**Estado: OK — 0 errores**

```
npx tsc --noEmit
```
