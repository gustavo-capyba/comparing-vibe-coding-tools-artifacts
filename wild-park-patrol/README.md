# WildlifeTrack

A responsive web app to track wildlife in a nature park: report sightings, subscribe
to species, receive context-aware notifications and trigger emergency alerts.

## Stack

- **Frontend:** React 19 + TanStack Start + Tailwind v4 + shadcn/ui
- **Map:** Leaflet + OpenStreetMap tiles (no API key)
- **Backend:** Lovable Cloud (PostgreSQL + Auth + Realtime)
- **Tests:** Vitest

## Architecture

```
src/
  routes/              file-based routing
    index.tsx          landing page
    login.tsx          login form
    signup.tsx         sign-up with document validation
    app.tsx            authenticated map dashboard
  components/
    MapView.tsx        Leaflet map (canvas, municipal-bounded)
    ui/                shadcn primitives
  lib/
    validation.ts      CPF/RG/US-DL/phone/plate rules (pure, tested)
    crowd.ts           Haversine + crowd-control + notification rules
    useGeolocation.ts  watchPosition hook with Recife fallback
    auth.tsx           auth context (optional)
    __tests__/         vitest unit tests
  integrations/supabase/  auto-generated Lovable Cloud client
```

### Backend tables (RLS enabled)

| Table | Purpose | Access |
|------|---------|--------|
| `profiles` | nationality, phone, plate, document | owner only |
| `sightings` | animal sightings with GPS | public read, owner write |
| `subscriptions` | which animals a user follows | owner only |
| `alerts` | emergency reports | public read, owner insert |

Realtime is enabled on `sightings` and `alerts`. New rows stream into the dashboard.

### Notification logic

A user is notified when:
1. They are subscribed to the animal type
2. The sighting is within `proximityMeters` (5 km)
3. The area around the sighting is **not crowded** (≥5 users within 300 m → suppressed)

Email notifications are simulated via `console.log("[email] …")`.

### Document validation

- **BR users** must provide either a valid CPF (with check digits) or RG (7–10 chars).
- **US users** must provide a valid driver license (5–20 alphanumerics).
- Phone: 8–15 digits. Plate: 4–8 alphanumeric chars.

### Map

- Canvas-rendered Leaflet, OpenStreetMap tiles.
- Initial zoom 13 (city/municipal scale), `minZoom: 11`, restricted to ±0.25° around
  the user (or Recife default `-8.063169, -34.871139`).
- `updateWhenIdle` + `keepBuffer:1` for low tile load.

## Setup

```bash
bun install
bun run dev      # starts Vite
bun run test     # run vitest unit tests
```

The Lovable Cloud `.env` is auto-managed:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

See `.env.example` for the keys you'd need outside of Lovable.

## Tests

```
bun run test
```

Covers:
- Document validation (CPF / RG / US driver license / phone / plate)
- Crowd control (distance, threshold, suppression)
- Notification logic (subscription + proximity + crowd)
