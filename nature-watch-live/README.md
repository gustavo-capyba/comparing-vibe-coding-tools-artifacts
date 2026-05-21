# WildlifeTrack

Real-time wildlife tracking app for nature parks. Visitors report animal sightings on a map, subscribe to species notifications, and trigger emergency alerts.

## Stack

- TanStack Start (React 19, Vite 7, file-based routing, SSR)
- Tailwind CSS v4 + shadcn/ui
- Leaflet + OpenStreetMap (no API key)
- Lovable Cloud (Supabase: Postgres + Auth + Realtime)
- Vitest for unit tests

## Setup

```bash
bun install
bun run dev          # dev server
bunx vitest run      # run unit tests
bun run build        # production build
```

Environment is auto-provisioned via Lovable Cloud. See `.env.example`.

## Architecture

```
src/
  routes/
    __root.tsx       Shell + providers
    index.tsx        Dashboard: map, sightings, subscriptions, SOS
    auth.tsx         Sign in / sign up (with document validation)
  components/
    Map.tsx          Leaflet map (municipal-bounded, OSM tiles)
    ClientOnly.tsx   Avoids SSR for browser-only widgets
  hooks/
    useAuth.ts       Supabase session listener
    useGeolocation.ts Browser GPS, falls back to Recife
  lib/
    validation.ts    Document/phone/plate validators (CPF checksum, RG, US DL)
    crowd.ts         Crowd-control suppression rule
    notify.ts        Subscriber matching + simulated email
    geo.ts           Haversine distance
  integrations/supabase/   Auto-generated Cloud client + types
```

### Data model (Postgres, RLS-protected)

- `profiles` — nationality, phone, plate, document (linked to auth user)
- `sightings` — animal_type, lat/lng, timestamp (broadcast via Realtime)
- `subscriptions` — per-user animal-type subscriptions
- `emergency_alerts` — SOS with location

### Notification & crowd-control flow

1. New sighting INSERT → broadcast via Supabase Realtime
2. Client checks: subscriber matches animal type + within 5 km
3. Crowd control: if ≥5 reporters within 300 m in last hour → suppress
4. Else: in-app toast + simulated email (console)

### Geolocation

- Map initializes on user GPS (with permission) or falls back to Recife (-8.063169, -34.871139).
- `maxBounds`, `minZoom 11`, `keepBuffer 1`, `updateWhenIdle` for tile efficiency.

### Document validation

- BR: CPF (11 digits + checksum) or RG (7-10 alphanum)
- US: Driver License (5-20 alphanum)

Unit tests live in `src/lib/__tests__/`.

### Emergency

SOS button writes an `emergency_alerts` row with location and logs a simulated park-staff notification to the console.

## Tests

```bash
bunx vitest run
```

Covers document validation, crowd control, and notification matching.