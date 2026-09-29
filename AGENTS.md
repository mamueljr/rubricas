# AGENTS.md

SPA de rúbricas (Vite + React 19 + TypeScript) desplegada en GitHub Pages.
Cada rúbrica vive como módulo en `src/rubricas/<id>/`.

## Comandos

- `npm run dev` — servidor local.
- `npm run build` — `tsc -b && vite build` (genera `dist/` y el service worker PWA).
- `npm run typecheck` — `tsc -b` sin emitir.
- No hay tests ni linter configurados.

## Arquitectura

- `src/router.tsx` usa `HashRouter` (necesario para GitHub Pages; no cambiar a BrowserRouter).
- Rúbrica: `src/rubricas/diseno-apps-moviles/rubrica.config.ts` (criterios, pesos, niveles, descriptores). Tipos en `src/tipos.ts`.
- Cálculo: `src/rubricas/diseno-apps-moviles/calculo.ts`.
- Acceso a datos: `src/lib/api.ts`. Funciona en dos modos:
  - **Nube** si `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` están configurados (`hayNube`).
  - **Local** (`localStorage`) como respaldo y para desarrollo sin credenciales.
- Sesión: `src/auth/sesion.ts` (Supabase anonymous auth; sin contraseña).
- RLS y funciones admin en `supabase/migrations/0001_init.sql`.

## Deploy

GitHub Pages **legacy** desde `main` rama `/docs`. El build genera `docs/`, que se
commitea y publica en https://mamueljr.github.io/rubricas/ (sin GitHub Actions).

- `npm run build` sale a `docs/` (`vite.config.ts` → `build.outDir`).
- Flujo: `npm run build && git add docs && git commit -m "build" && git push`.

## Base path

`vite.config.ts` fija `base: '/rubricas/'` y el `start_url`/`scope` del manifest. Si cambia el
nombre del repo, actualizar ambos aquí, `build.outDir` y el fallback del service worker.

## Convenciones

- Texto de UI en español; mobile-first (objetivos táctiles ≥ 48px, inputs a 16px, `env(safe-area-inset-bottom)`).
- Colores desde los tokens CSS en `src/index.css`; definir en claro y oscuro a la vez.
- Una rúbrica nueva = una carpeta en `src/rubricas/` + registrarla en el arreglo `rubricas`.

## Configuración pendiente de entorno

- Variables de build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_KEY`
  (se hornean en el bundle al compilar; GitHub Pages no da variables de runtime).
- Supabase: habilitar **Anonymous sign-ins** en Authentication → Providers.
- Pages: fuente "Deploy from a branch" → `main` / `/docs`.
