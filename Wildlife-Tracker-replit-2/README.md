# Wildlife Track

A responsive real-time wildlife monitoring web application for nature parks. Visitors can track animal sightings on a live map, subscribe to species notifications, and trigger emergency alerts.

## Features

- **User Registration & Login** — nationality-based document validation (BR: CPF/RG, US: Driver License)
- **Live Map Dashboard** — Leaflet + OpenStreetMap, GPS-centered, animal sighting markers, emergency markers
- **Animal Sightings** — report with GPS auto-capture, browse and filter all sightings
- **Notifications** — subscribe to animal types, in-app alerts, simulated email notifications
- **Crowd Control** — automatic notification suppression when too many users are near a sighting
- **Emergency Alerts** — one-tap emergency with GPS location, simulated park staff notification

## Stack

- **Frontend**: React + Vite, Leaflet, TanStack Query, shadcn/ui, Tailwind CSS, Wouter
- **Backend**: Express 5, Node.js 24, TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Validation**: Zod, drizzle-zod, OpenAPI codegen (Orval)
- **Testing**: Vitest

## Project Structure

```
artifacts/
  api-server/        — Express 5 backend
    src/
      routes/        — auth, sightings, notifications, emergencies, stats
      lib/           — auth helpers, crowd control logic
  wildlife-track/    — React + Vite frontend
    src/
      pages/         — dashboard, sightings, report, emergency, notifications, profile, auth
      components/    — layout, shadcn/ui components
      lib/           — auth context, document validation
lib/
  api-spec/          — OpenAPI spec (source of truth)
  api-client-react/  — Generated React Query hooks
  api-zod/           — Generated Zod validation schemas
  db/                — Drizzle ORM schema & client
```

## Setup

### Prerequisites

- Node.js 24+
- pnpm 10+
- PostgreSQL database

### Environment Variables

Copy `.env.example` and fill in values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for JWT signing |

### Install & Run

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Run API server (port 5000 by default)
pnpm --filter @workspace/api-server run dev

# Run frontend (in another terminal)
pnpm --filter @workspace/wildlife-track run dev
```

### Regenerate API types after spec changes

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Running Tests

### Document validation tests (frontend)

```bash
cd artifacts/wildlife-track
npx vitest run src/lib/validations.test.ts
```

### Crowd control & notification logic tests (backend)

```bash
cd artifacts/api-server
npx vitest run src/lib/crowd-control.test.ts
```

## Architecture

### Contract-first API

All API contracts are defined in `lib/api-spec/openapi.yaml`. Running codegen generates:
- Zod validation schemas in `lib/api-zod/` (used by the server for request/response validation)
- React Query hooks in `lib/api-client-react/` (used by the frontend)

### Authentication

JWT tokens are stored in `localStorage` under `wt_token`. Every API request attaches the token as a `Bearer` header via the custom fetch wrapper (`lib/api-client-react/src/custom-fetch.ts`).

### Crowd Control Logic

When a new sighting is reported, the server:
1. Fetches all sightings in the last 30 minutes
2. Counts unique users whose sightings are within 0.5 km of the new sighting
3. If 5 or more unique users are nearby → `notificationsSuppressed = true`
4. Otherwise → notifications are dispatched to all subscribers of that animal type

### Notification Dispatch

When a sighting is reported and crowd control does not suppress it:
- The server queries all subscriptions for the animal type
- For each subscriber (except the reporter), a notification row is inserted
- If the subscriber has `emailNotify: true`, the notification is logged to the server console (simulated email)

### Map

The Leaflet map initializes at city/municipal zoom (level 12). It requests the browser's geolocation and recenters if granted. Falls back to Recife, Brazil (-8.063169, -34.871139). Sightings are displayed as green dot markers; active emergencies as pulsing red markers.

## Demo Credentials

After seeding:
- **Email**: `ranger@wildlife.park`
- **Password**: `ranger123`
