# Wildlife Track

A real-time nature park wildlife tracking app: users report animal sightings,
subscribe to species alerts, and trigger emergency notifications — all on a
live map.

## Stack

- **Frontend**: React 19, TanStack Start (SSR), TanStack Router, Tailwind CSS
  v4, shadcn/ui, Leaflet + react-leaflet (OpenStreetMap, no API key).
- **Backend**: Lovable Cloud (managed Supabase) — Postgres with Row Level
  Security, Auth (email/password), and Realtime channels.
- **Testing**: Vitest.

## Setup

```bash
bun install
bun run dev        # start dev server
bun run build      # production build
bunx vitest run    # run unit tests
```

Environment variables are auto-provisioned in `.env` by Lovable Cloud. See
`.env.example` for the variables a self-hosted clone would need.

## Architecture

```
src/
  routes/
    __root.tsx          App shell (AuthProvider, Header, Toaster)
    index.tsx           Map + sighting/emergency forms
    auth.tsx            Sign in / Sign up with document validation
    subscriptions.tsx   Manage per-species notification subscriptions
  components/
    Header.tsx
    WildlifeMap.tsx     Leaflet map (lazy-loaded, bounded to municipal area)
  contexts/AuthContext.tsx
  lib/
    validators.ts       CPF, RG, US driver license validation
    crowd-control.ts    Threshold-based suppression
    notifications.ts    Subscriber matching + simulated email
    geo.ts              Haversine + Recife defaults / municipal bounds
  integrations/supabase/ (auto-generated client)
```

### Data model (Postgres / RLS)

- `profiles` — nationality (BR|US), phone, license plate, document.
  RLS: each user reads/writes their own row.
- `sightings` — animal type, GPS coords, timestamp, optional notes.
  RLS: any authenticated user can read; only the reporter can edit/delete.
- `emergency_alerts` — GPS coords + message. RLS: user sees own; staff
  (via `user_roles`) see all.
- `subscriptions` — `(user_id, animal_type)` pairs.
- `user_roles` + `has_role()` SECURITY DEFINER function (no role escalation
  via profile editing).

### Geolocation

The home page requests browser geolocation. On grant, the map centers on the
user. On denial / unavailable, it falls back to **Recife, Brazil
(-8.063169, -34.871139)**. The map is restricted to a ~30 km municipal
bounding box with `minZoom=11` and `tileLayer.bounds` to minimize tile
loading.

### Realtime + crowd control

Sightings and emergency alerts publish to a Supabase Realtime channel. On
new sightings, the client looks up subscribers and runs
`computeNotifyTargets()` which:

1. Filters by subscribed animal type and proximity (`nearbyRadius`).
2. Suppresses notifications if too many users are near the sighting
   (threshold-based crowd control).
3. Logs simulated emails to the browser console.

### Document validation

- **BR**: CPF (11-digit modulus check) **or** RG (state-agnostic format).
- **US**: driver license (5–20 alphanumeric chars).

Validation runs client-side before signup and is covered by Vitest in
`src/lib/validators.test.ts`.

## Tests

```bash
bunx vitest run
```

Covers:
- Document validation (CPF/RG/US DL + dispatcher)
- Crowd-control suppression
- Notification target computation
