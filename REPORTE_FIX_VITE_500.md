# REPORTE_FIX_VITE_500.md

## 1. Causa raíz

El primer error REAL de Vite (no el 500 del browser) era:

```
[vite:import-analysis] Failed to resolve import "../../hooks/useResources"
from "src/pages/dashboard/resources/ResourcesPage.tsx". Does the file exist?
```

Y el mismo patrón se repetía en `PublicationsPage.tsx` y `ActivitiesPage.tsx`:

```
Failed to resolve import "../../hooks/usePublications"
Failed to resolve import "../../hooks/useActivities"
```

**Causa:** Las páginas creadas en subdirectorios de `src/pages/dashboard/` usaban imports relativos con `../../` en lugar de `../../../`.

Desde `src/pages/dashboard/resources/ResourcesPage.tsx`:
- `../../hooks/useResources` → resuelve a `src/pages/hooks/useResources.ts` (NO EXISTE)
- `../../../hooks/useResources` → resuelve a `src/hooks/useResources.ts` (correcto)

Lo mismo ocurría con `../../services/...`, `../../components/...`, `../../store/...` y `../../types`.

**Primer error adicional:** `ProfessorProfilePage.tsx` tenía un parse error:
```
[vite:oxc] Error: Unexpected token
src/pages/public/ProfessorProfilePage.tsx:31:7
31 │  finally{
```
Faltaba el `}` de cierre del bloque `try` antes de `finally`.

---

## 2. Archivos tocados

### Fix de parse error
- `src/pages/public/ProfessorProfilePage.tsx`

### Fix de imports relativos
- `src/pages/dashboard/resources/ResourcesPage.tsx`
- `src/pages/dashboard/publications/PublicationsPage.tsx`
- `src/pages/dashboard/activities/ActivitiesPage.tsx`

### Verificación de rutas correctas
- `src/pages/dashboard/resources/CreateResourcePage.tsx` — ya usaba `../../../` (correcto)
- `src/pages/dashboard/resources/EditResourcePage.tsx` — ya usaba `../../../` (correcto)
- `src/pages/dashboard/publications/CreatePublicationPage.tsx` — ya usaba `../../../` (correcto)
- `src/pages/dashboard/publications/EditPublicationPage.tsx` — ya usaba `../../../` (correcto)
- `src/pages/dashboard/activities/CreateActivityPage.tsx` — ya usaba `../../../` (correcto)
- `src/pages/dashboard/activities/EditActivityPage.tsx` — ya usaba `../../../` (correcto)

---

## 3. Antes/después de exports

### ProfessorProfilePage.tsx

**Antes:**
```ts
      try {
        const [profileData, projectsData] = await Promise.all([...])
        setProfile(profileData)
        setProjects(projectsData)
      finally {
```

**Después:**
```ts
      try {
        const [profileData, projectsData] = await Promise.all([...])
        setProfile(profileData)
        setProjects(projectsData)
      } finally {
```

### ResourcesPage.tsx (y mismo patrón en PublicationsPage y ActivitiesPage)

**Antes:**
```ts
import { useResources } from '../../hooks/useResources'
import { resourcesService } from '../../services/resources.service'
import { ResourceCard } from '../../components/resources/ResourceCard'
import { LoadingSpinnerCentered } from '../../components/ui/LoadingSpinner'
import { useAuthStore } from '../../store/authStore'
import type { Resource } from '../../types'
```

**Después:**
```ts
import { useResources } from '../../../hooks/useResources'
import { resourcesService } from '../../../services/resources.service'
import { ResourceCard } from '../../../components/resources/ResourceCard'
import { LoadingSpinnerCentered } from '../../../components/ui/LoadingSpinner'
import { useAuthStore } from '../../../store/authStore'
import type { Resource } from '../../../types'
```

---

## 4. Resultado: los 4 módulos cargan

| URL | Estado |
|-----|--------|
| `/src/pages/public/ProfessorProfilePage.tsx` | 200 |
| `/src/pages/dashboard/resources/ResourcesPage.tsx` | 200 |
| `/src/pages/dashboard/publications/PublicationsPage.tsx` | 200 |
| `/src/pages/dashboard/activities/ActivitiesPage.tsx` | 200 |

También verificadas las rutas de la app (retornan HTML 200):
- `/dashboard/resources`
- `/dashboard/publications`
- `/dashboard/activities`

---

## 5. tsc

**Estado: OK — 0 errores**

```
npx tsc --noEmit
```

Comando ejecutado después de corregir los imports. Sin errores de tipado.

---

## 6. Cómo abrir la app

Abre `http://localhost:9988/` en tu navegador. Para detener el servidor, presiona `Ctrl+C` en la terminal.
