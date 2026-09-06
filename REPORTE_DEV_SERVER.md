# REPORTE_DEV_SERVER.md

## 1. Resumen

**¿Arrancó? Sí**

El servidor de desarrollo de Vite se inició correctamente en el puerto configurado (9988). No se requirieron cambios de código ni configuraciones adicionales.

---

## 2. Comando exacto y URL local

```bash
npm run dev
```

**URL local:** `http://localhost:9988/`

Vite confirmó en terminal:
```
VITE v8.0.11  ready in 4303 ms

➜  Local:   http://localhost:9988/
➜  Network: use --host to expose
```

---

## 3. Errores encontrados y cómo se arreglaron

**No se encontraron errores.**

- `npm install` ya tenía las dependencias instaladas.
- `npx tsc --noEmit` pasó con 0 errores.
- El servidor inició sin errores de compilación, imports rotos o rutas mal exportadas.
- No fue necesario corregir código.

---

## 4. Variables de entorno que el usuario debe tener

El proyecto lee variables desde `import.meta.env` en `src/lib/supabaseClient.ts`. Deben estar definidas en un archivo `.env` en la raíz del proyecto.

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key de Supabase |

**Archivo esperado:** `.env` en la raíz del repositorio.

**Nota:** No se expone el contenido del `.env` existente por seguridad. Si el usuario necesita crear o actualizar estas variables, debe copiarlas desde su proyecto Supabase (Settings → API).

---

## 5. Resultado tsc

**Estado: OK — 0 errores**

```
npx tsc --noEmit
```

Ejecutado antes de iniciar el servidor. Sin errores de tipado.

---

## 6. Cómo abrir la app

Abre tu navegador en `http://localhost:9988/`. Para detener el servidor, presiona `Ctrl+C` en la terminal donde se ejecuta `npm run dev`.
