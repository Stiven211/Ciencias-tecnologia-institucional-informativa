# REPORTE_CRUD_ACTIVIDADES.md

## 1. Resumen

Se implementó el CRUD completo de Actividades en el dashboard del profesor, siguiendo el patrón de Recursos y Publicaciones:
- **Rutas y nav**: se añadieron rutas protegidas y el ítem "Actividades" en el sidebar.
- **Servicio**: se extendió `activities.service.ts` con `getActivityById`, `getMyActivities`, `getAllActivities` (admin).
- **Listado**: `ActivitiesPage` con búsqueda, paginación, estado vacío honesto, y toggle "Ver todas" para admin.
- **Formulario**: `ActivityForm` alineado al schema real (`title`, `description`, `due_date`).
- **Create/Edit**: páginas con estado `loading | not-found | forbidden | error | ready` y ownership check.
- **Eliminar**: `DeleteActivityModal` con confirmación.
- **QuickActions**: se añadió CTA a "Actividades".
- **UpcomingTasks**: ya consumía `activitiesService.getUpcomingTasks(5)` y maneja `due_date` null sin crashear.

No se tocaron políticas SQL, no se habilitó catálogo público y no se rediseñó la UI.

---

## 2. Columnas reales usadas

### `supabase/schema.sql` — tabla `activities`

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Columnas usadas en el CRUD

| Columna | Tipo | Uso en formulario |
|---------|------|-------------------|
| `id` | UUID | PK, generada por DB |
| `professor_id` | UUID | FK a `profiles(id)`, se asigna en create |
| `title` | TEXT NOT NULL | Input de texto, requerido, mín 3 caracteres |
| `description` | TEXT | Textarea opcional |
| `due_date` | DATE | Input date, opcional |
| `created_at` | TIMESTAMP | Auto-generado por DB |
| `updated_at` | TIMESTAMP | Auto-actualizado por trigger |

No se usan columnas inexistentes. No hay bucket de storage asociado.

---

## 3. Rutas + nav

### Rutas añadidas (`src/App.tsx`)

| Ruta | Componente | Protección |
|------|-----------|------------|
| `/dashboard/activities` | `ActivitiesPage` | `ProtectedRoute` (dashboard) |
| `/dashboard/activities/new` | `CreateActivityPage` | `create_activity` |
| `/dashboard/activities/:id/edit` | `EditActivityPage` | `edit_own_activity` |

### Nav (`src/config/navigation.ts`)

```ts
{
  name: 'Actividades',
  href: '/dashboard/activities',
  icon: Calendar,
  permission: 'create_activity'
}
```

Visible para `teacher` y `admin`.

### Permisos añadidos (`src/config/permissions.ts`)

- `create_activity`
- `edit_own_activity`
- `delete_own_activity`

Asignados a `admin` y `teacher`.

---

## 4. API

### Métodos añadidos/modificados en `src/services/activities.service.ts`

| Método | Query | Retorno |
|--------|-------|---------|
| `getActivityById(id)` | `select(*, professor:profiles(...)).eq('id', id).single()` | `Promise<Activity>` |
| `getMyActivities(userId)` | `select(*, professor:profiles(...)).eq('professor_id', userId).order('created_at')` | `Promise<Activity[]>` |
| `getAllActivities()` | `select(*, professor:profiles(...)).order('created_at')` | `Promise<Activity[]>` |

No hay upload de archivos ni path de storage.

---

## 5. UpcomingTasks

`src/components/dashboard/UpcomingTasks.tsx` ya consumía `activitiesService.getUpcomingTasks(5)` antes de esta tarea.

- **due_date null**: el componente ya maneja `due_date` null con el fallback `'Sin fecha'` en línea 48-53.
- `getUpcomingTasks` filtra con `.gte('due_date', ...)`, por lo que actividades sin fecha límite no aparecen en esta vista. No crashea.

No se requirieron cambios en `UpcomingTasks`.

---

## 6. Resultado tsc

**Estado: OK — 0 errores**

```
npx tsc --noEmit
```

El comando terminó sin errores. No fue necesario corregir tipos, imports ni props.

---

## 7. Cómo probar

### Requisitos previos
- Estar logueado como `teacher` o `admin`.

### Flujo de prueba manual

1. **Navegación**
   - Ir a `/dashboard/activities`.
   - Verificar que aparece "Actividades" en el sidebar.
   - Verificar que el botón "Nueva actividad" dirige a `/dashboard/activities/new`.

2. **Crear actividad**
   - Click en "Nueva actividad".
   - Título: `Prueba actividad 1`.
   - Descripción: `Descripción de prueba`.
   - Fecha límite: seleccionar fecha.
   - Enviar.
   - Verificar redirección a `/dashboard/activities`.
   - Verificar que aparece en la lista.

3. **Crear actividad sin fecha**
   - Click en "Nueva actividad".
   - Título: `Actividad sin fecha`.
   - Sin fecha límite.
   - Enviar.
   - Verificar que aparece con badge "Pendiente" y "Sin fecha".

4. **Editar actividad**
   - Click en ícono de edición.
   - Modificar título o descripción.
   - Cambiar fecha límite.
   - Enviar.
   - Verificar que los cambios se reflejan.

5. **Eliminar actividad**
   - Click en ícono de eliminar.
   - Confirmar en el modal.
   - Verificar que desaparece de la lista.

6. **Admin: ver todas**
   - Loguearse como admin.
   - Ir a `/dashboard/activities`.
   - Verificar botón "Ver todas".
   - Click y confirmar que aparecen actividades de todos los profesores.
   - Verificar que puede editar/eliminar actividades ajenas.

7. **Profesor: ver solo las suyas**
   - Loguearse como teacher.
   - Ir a `/dashboard/activities`.
   - Verificar que no aparece botón "Ver todas".
   - Verificar que solo ve sus propias actividades.

8. **Búsqueda**
   - Crear varias actividades con títulos distintos.
   - Usar el buscador en la lista.
   - Verificar que filtra por título y descripción.

9. **Estados vacíos**
   - Sin actividades: verificar mensaje honesto "No hay actividades" con CTA.
   - En edición con ID inexistente: verificar "Actividad no encontrada".
   - En edición de actividad ajena (sin ser admin): verificar "Sin permisos".

---

## 8. Pendientes

- [ ] **Catálogo público de actividades**: actualmente el CRUD es solo dashboard. Hacer una página pública queda fuera de esta tarea.
- [ ] **Notificaciones o recordatorios**: `due_date` se guarda pero no hay sistema de notificaciones para actividades próximas o vencidas.
- [ ] **Filtros avanzados**: filtrar por estado (pendiente/vencida), rango de fechas, etc.
- [ ] **Ordenamiento**: permitir ordenar por fecha límite, título, etc.
- [ ] **Marcar como completada**: agregar un estado `completed` o similar si el flujo lo requiere en el futuro.
