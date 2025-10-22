# Copilot instructions for Trials Frontend

Quick guidance to help AI coding agents be productive in this repository.

- Project type: React + TypeScript app built with Vite. Entry points: `src/main.tsx`, `src/App.tsx`.
- Run & build:
  - Dev server: `npm run dev` (Vite on http://localhost:3000)
  - Production build: `npm run build` (runs `tsc` then `vite build`)
  - API backend expected at `http://localhost:8001` (proxied at `/api` in `vite.config.ts`).

Architecture / big picture
- UI: `src/pages/` (page components) and `src/components/` (reusable UI pieces). `src/components/layout/MainLayout.tsx` defines global navigation.
- Data layer: `src/api/` contains Axios clients and service functions (see `src/api/client.ts`). All network calls go through these services.
- React Query: each service has corresponding React Query hooks in `src/hooks/` (e.g. `useTrialPlans`, `useDictionaries`). Use these hooks for data fetching and cache invalidation.
- Auth: token-based auth is stored in `localStorage` as `auth_token`. Axios attaches `Authorization: Token <token>` in `src/api/client.ts`.
- Types: API shapes and TS types live in `src/types/api.types.ts`. Prefer using these types when manipulating API data.

Conventions & patterns to follow
- Services -> hooks -> components: add API methods in `src/api/*`, then add a `useX` hook in `src/hooks`, then consume in components/pages.
- Prefer React Query for fetching and mutations. Invalidate queries using keys defined near hooks (see `src/hooks/useTrialPlans.ts`).
- UI library: MUI v5 is used; theme is created in `src/App.tsx`. Use the theme palette for colors and `sx` prop for small styles.
- Routing: React Router v6. Pages live under `src/pages/*`, add routes in `src/App.tsx` and menu entries in `MainLayout.tsx`.
- Defensive coding for API shapes: the backend sometimes returns slightly different shapes (e.g., `plan.cultures` vs `plan.oblast.cultures`). Prefer safe access and normalize shapes in service layer when possible.

Important files to inspect when changing behavior
- `src/api/client.ts` — axios client, auth header, 401 handling (redirects to `/login`).
- `vite.config.ts` — dev proxy for backend (`/api -> http://localhost:8001`).
- `src/hooks/useTrialPlans.ts` — example of query keys and react-query usage patterns.
- `src/pages/TrialPlans/TrialPlansList.tsx` — example of defensive data handling and statistics calculations.

Developer workflows & debugging
- To test changes quickly: run `npm run dev` and open http://localhost:3000. The frontend proxies `/api` to the backend.
- When fixing runtime errors in components, check network responses (Chrome DevTools) to confirm API shapes. Many components rely on `response.data` shapes directly.
- TypeScript is strict (`strict: true`) and `npm run build` runs `tsc`. Some files currently contain type errors — prefer small, local fixes and avoid changing global tsconfig.
- To force a normalized API shape, add a transform in the corresponding service method (e.g., map `getTrialPlans()` response to ensure `cultures` always exists).

Safety notes
- Do not attempt to change auth flow globally without checking `src/api/client.ts` and `src/contexts/AuthContext.tsx`.
- Avoid committing real secrets (API keys, tokens). The project expects `auth_token` in localStorage for dev.

If anything in this file is unclear or you'd like more details (tests, CI, or to normalize API responses centrally), tell me which area to expand and I will update this guidance.