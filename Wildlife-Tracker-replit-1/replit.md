# Wildlife Track

A nature park management system where visitors track wildlife sightings, receive subscription-based notifications, and handle emergencies — with nationality-based document validation and crowd-control alerts.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000 → proxied at `/api`)
- `pnpm --filter @workspace/wildlife-track run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run test` — run all unit tests (document validation, crowd control, notifications)
- Required env: `DATABASE_URL` — Postgres connection string

## Demo Accounts

Seeded automatically on first run:
- **alice@example.com** / password123 (BR, CPF)
- **bob@example.com** / password123 (US, driver_license)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS v4 + shadcn/ui + Wouter + Leaflet
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (Bearer token, stored in localStorage as `wt_token`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth OpenAPI spec for all endpoints
- `lib/db/src/schema/` — Drizzle table definitions (users, sightings, subscriptions, notifications, emergencies)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/` — auth.ts, document-validation.ts, crowd-control.ts, notifications.ts, seed.ts
- `artifacts/api-server/src/tests/` — unit tests (document-validation, crowd-control, notifications)
- `artifacts/wildlife-track/src/pages/` — React pages (home, map, sightings, notifications, subscriptions, emergencies, profile)
- `artifacts/wildlife-track/src/lib/auth.tsx` — AuthContext + useAuth hook
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks (do not edit manually)

## Architecture Decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → typed React Query hooks + Zod schemas; server validates all I/O with Zod
- **Crowd control**: Haversine distance calculation counts nearby sightings within 0.5km radius; notifications suppressed when `crowdCount >= 5` (CROWD_THRESHOLD constant)
- **Document validation**: Nationality-gated — BR accepts CPF (11-digit with check-digit algorithm) or RG (7–9 chars); US accepts driver's license (5–16 alphanumeric)
- **Notification system**: Fire-and-forget on sighting creation — subscribers to the spotted animal type receive in-app notifications; suppressed if area is crowded
- **Leaflet map**: Loaded dynamically via `import("leaflet")` to avoid SSR issues; default center at Recife, Brazil (-8.063169, -34.871139); markers color-coded (red = crowded, green = normal)

## Product

- **Dashboard**: Real-time stats (total sightings, active emergencies) + species breakdown + recent activity feed
- **Live Map**: Interactive Leaflet map with GPS, click-to-report sightings, species filter, color-coded crowd markers
- **Sightings**: Full list view with species filtering, crowd status badges, GPS coordinates
- **Notifications**: In-app alerts for subscribed species with unread badge counter in nav
- **Subscriptions**: Per-species toggle subscriptions for alert configuration
- **Emergencies**: Trigger emergency alerts with GPS coordinates, two-step confirmation dialog, resolve flow
- **Profile**: User info display with document details, sighting count, subscription count

## User Preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing the OpenAPI spec, always run `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks
- The codegen barrel fix in `lib/api-spec/package.json` overwrites `lib/api-zod/src/index.ts` — do NOT add to that file manually
- `lib/api-zod/src/index.ts` must only contain `export * from "./generated/api";`
- React Query hooks from Orval require `queryKey` when passing `query` options (use the generated `get*QueryKey()` helper)
- The api-server seeds demo users automatically on first startup via `seedIfEmpty()`
- Leaflet CSS must be imported explicitly: `import "leaflet/dist/leaflet.css"`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
