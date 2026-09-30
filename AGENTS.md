# AGENTS.md

SPA de rúbricas (Vite + React 19 + TypeScript, PWA) desplegada en GitHub Pages.
Cada rúbrica vive como módulo en `src/rubricas/<id>/`.

## Comandos

- `npm run dev` — servidor local.
- `npm run typecheck` — `tsc -b --noEmit` (no existe script de emit separado).
- `npm run build` — `tsc -b && vite build`; genera `docs/` y el service worker PWA.
- No hay tests ni linter configurados. `tsconfig.app.json` es estricto con
  `noUnusedLocals` / `noUnusedParameters`, así que imports y vars sin usar rompen el build.

## Arquitectura

- `src/router.tsx` usa `HashRouter` (necesario para GitHub Pages; no cambiar a
  BrowserRouter). Rutas: `/`, `/rubrica/:rubricaId`, `/rubrica/:rubricaId/equipo/:equipoId`, `/admin`.
- Rúbrica: `src/rubricas/diseno-apps-moviles/rubrica.config.ts` exporta la rúbrica,
  el arreglo `rubricas` y `obtenerRubrica`. Cálculo de puntaje en `calculo.ts`
  (normaliza el nivel y reparte el peso; devuelve `null` si falta algún criterio).
- **Gotcha:** aunque registres otra rúbrica en `rubricas`, `Admin.tsx` y
  `EvaluacionWizard.tsx` importan directo `diseno-apps-moviles/rubrica.config` y
  `.../calculo`. Hay que tocar esas páginas para soportar una segunda rúbrica.
- `src/lib/supabase.ts` define `hayNube`: sólo es nube si `VITE_SUPABASE_URL`
  tiene forma de URL válida (descarta la plantilla con `xxxxxxxx`).
- Acceso a datos: `src/lib/api.ts`, con dos modos:
  - **Nube** si `hayNube` (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` configurados).
  - **Local** (`localStorage`, `src/lib/almacen.ts`) como respaldo y para desarrollo
    sin credenciales. En local, `esAdmin('')` devuelve `true` si `VITE_ADMIN_KEY` no
    está definido.
- Sesión: `src/auth/sesion.ts` (sólo pide nombre; Supabase anonymous auth, sin contraseña).
- Borradores offline: `src/lib/borradorOffline.ts` guarda en `rubricas.borradores`
  con flag `pendiente`; el wizard reintenta sincronizarlos al cargar.
- Exportación CSV (con BOM UTF-8) en `src/lib/exportar.ts`.
- Panel admin: `promediosPorEquipo` (en `src/lib/api.ts`) cuenta sólo evaluaciones
  `enviado` y devuelve `evaluadores` (ids) por equipo, que `Admin.tsx` traduce a nombres.

## Supabase

- Migraciones en `supabase/migrations/` (`0001_init.sql`, `0002_admin_borrados.sql`);
  **no se aplican solas**: hay que ejecutarlas en el SQL Editor o con `supabase db push`.
  Sin la 0002, los botones de borrado admin fallan en modo nube.
- `supabase/seed.sql` define la clave admin (hasheada con `hash_clave`); reemplaza
  `CAMBIA_ESTA_CLAVE` antes de ejecutarlo. El repo es público: no commitear la clave real.
- La gestión admin (equipos, listar evaluaciones/evaluadores) pasa por RPC `security
  definer` validadas con `admin_login`, no por escritura directa. RLS: cada evaluador
  sólo ve/edita sus evaluaciones.

## Deploy

GitHub Pages **legacy** desde `main` rama `/docs`. El build genera `docs/`, que se
commitea y publica en https://mamueljr.github.io/rubricas/ (sin GitHub Actions).
`docs/` está en git; `dist/` y `*.tsbuildinfo` están ignorados.

- Flujo: `npm run build && git add docs && git commit -m "build" && git push`.
- `build.emptyOutDir` vacía `docs/` en cada build, así que no pongas archivos ahí a mano.

## Base path

`vite.config.ts` fija `base: '/rubricas/'`, el `start_url`/`scope` del manifest y el
`navigateFallback` del service worker. Si cambia el nombre del repo, actualizar los tres
y el `base`.

## Convenciones

- Texto de UI en español; mobile-first (objetivos táctiles ≥ 48px, inputs a 16px, `env(safe-area-inset-bottom)`).
- Colores desde los tokens CSS en `src/index.css`; definir en claro y oscuro a la vez.
- Variables de build (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_KEY`) se
  hornean en el bundle al compilar; GitHub Pages no da variables de runtime. Usa `.env.local`
  (ver `.env.local.example`).

## Diseño (identidad editorial)

- Estética editorial académica: papel/tinta, títulos en serif, bordes hairline, radios 6/4px,
  sin gradientes ni sombras. Evitar el look "SaaS" (violeta + glow) que tenía la versión previa.
- Tokens en `src/index.css` (`:root` y `@media (prefers-color-scheme: dark)`): `--bg`,
  `--superficie*`, `--texto*`, `--borde*`, `--primario` (oxblood `#8a2b2b`). Cambiar el acento
  es editar esos tokens; definir siempre claro y oscuro.
- Tipografía: títulos con `Newsreader Variable` (`@fontsource-variable/newsreader/opsz.css`,
  self-host, offline en la PWA). Cuerpo: sans del sistema.
- `#root` es `flex` column con `min-height:100dvh` y `.app` usa `flex:1`, para que el pie quede
  al fondo sin depender de la altura del contenido.
- Autoría: `src/componentes/Pie.tsx` (M.I.C. Emmanuel Rojas · ESISCOM) se muestra en login,
  inicio, lista, admin y cierre del wizard. No duplicar ese texto; reutilizar `<Pie />`.
