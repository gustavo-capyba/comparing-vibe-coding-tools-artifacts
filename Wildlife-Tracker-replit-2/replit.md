# Wildlife Track

A responsive real-time wildlife monitoring web application for nature parks. Visitors track animal sightings on a live map, subscribe to species notifications, and trigger emergency alerts.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/wildlife-track run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Leaflet + OpenStreetMap, TanStack Query, shadcn/ui, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken) + bcrypt
- Validation: Zod (`zod/v4`), `drizzle-zod`, Orval codegen
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod validation schemas
- `lib/db/src/schema/` — Drizzle ORM table definitions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/` — auth helpers, crowd-control logic
- `artifacts/wildlife-track/src/pages/` — React pages
- `artifacts/wildlife-track/src/lib/validations.ts` — Document validation

## Architecture decisions

- Contract-first: all endpoints defined in OpenAPI, hooks and Zod schemas are generated — never hand-written.
- JWT auth stored in localStorage under `wt_token`; attached to every request via `setAuthTokenGetter`.
- Crowd control: new sighting checks nearby sightings (0.5 km radius, last 30 min) — 5+ unique users → notifications suppressed.
- Leaflet loaded dynamically via `import("leaflet")` to avoid SSR issues; map markers are custom HTML divIcons.
- Email notifications are simulated — logged to server console with `[EMAIL SIMULATION]` prefix.

## Product

- Map dashboard: live OpenStreetMap with green sighting markers and pulsing red emergency markers
- Sightings list: filterable table with animal type breakdown
- Report sighting: auto-captures GPS, select animal type and add notes
- Emergency alert: one-tap alert with GPS, simulated park staff notification
- Notifications: in-app notification feed + subscription manager per animal type
- User registration with nationality-based document validation (BR: CPF/RG, US: Driver License)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before using new types.
- The codegen script patches `lib/api-zod/src/index.ts` after orval runs (to remove conflicting re-exports).
- Leaflet CSS must be loaded via CDN link in dashboard.tsx (no bundled import) to avoid asset resolution issues.
- Map markers cannot be imported directly from the leaflet NPM package icons — use CDN URLs.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Demo login: `ranger@wildlife.park` / `ranger123`
