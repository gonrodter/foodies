# Foody 🍽️ — Seville

Map-first social app for foodie reviews. Real-time pins, clustering, clean 3D look.

## Stack

- Next.js (App Router) + React + TypeScript
- Mapbox GL (`react-map-gl`) — 3D pitched map, `standard` style
- `supercluster` — pin clustering with `2+` count badges
- Supabase — auth / Postgres+PostGIS / realtime (wired but optional)

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in your keys
npm run dev
```

Open http://localhost:3000

### Keys

- `NEXT_PUBLIC_MAPBOX_TOKEN` — free at https://account.mapbox.com/access-tokens/ (required to show map)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — optional; app runs on mock data until set

## Current (MVP)

- Pitched 3D Seville map
- Custom emoji review pins with green-check + clustering (`2+`)
- Tap pin → floating review card; tap cluster → zoom in
- Mock reviews in `lib/mockReviews.ts`

## Next

- Supabase `reviews` table (PostGIS) + realtime subscription → live pins
- Auth + create-review flow (photo upload, rating, place search)
- Filters by category, "add place" pin
