# REPORTE_GALLERY_UX.md

## 1. Comportamiento create vs edit

### Antes
- En **create** (`projectId === 'new'`): el usuario podía seleccionar imágenes y ver previews, pero el botón "Subir X imágenes" estaba deshabilitado. Esto hacía parecer que la galería estaba rota.
- En **edit** (`projectId` real): el usuario podía seleccionar imágenes y el botón "Subir X imágenes" subía las imágenes inmediatamente, independientemente del submit del formulario.

### Después
- En **create**: el usuario puede seleccionar imágenes (input file + previews). No se muestra el botón "Subir X imágenes". En su lugar, aparece el texto: *"Las imágenes se subirán al crear el proyecto."* Los archivos quedan en `galleryFiles` y `ProjectForm` los sube durante el submit.
- En **edit**: mismo flujo unificado. No hay botón "Subir X imágenes". Las imágenes seleccionadas se suben al guardar el proyecto. No se suben antes del submit.

### Flujo unificado (create + edit)
1. Usuario selecciona imágenes → previews visibles.
2. Usuario completa el formulario y hace clic en **Guardar**.
3. `ProjectForm.onSubmit`:
   - Crea/actualiza el proyecto.
   - Sube la portada (si hay).
   - Sube las imágenes de galería (si hay `galleryFiles`).
   - Actualiza el proyecto con las URLs de galería.

No hay subida a Storage antes del insert. No se usa `crypto.randomUUID`.

---

## 2. Archivos tocados

- `src/components/projects/GalleryUpload.tsx`
  - Eliminado botón "Subir X imágenes".
  - Eliminado estado `uploading` y `error` locales.
  - Eliminada función `uploadAll`.
  - Añadido texto condicional en create: *"Las imágenes se subirán al crear el proyecto."*
  - Input file sigue disponible en ambos modos.

- `src/components/projects/ProjectForm.tsx`
  - Sin cambios. Ya manejaba el flujo de galería en el submit (crear → upload → update).

---

## 3. tsc

**Estado: OK — 0 errores**

```
npx tsc --noEmit
```
