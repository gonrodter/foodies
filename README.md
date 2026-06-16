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

Mobile-first app shell with bottom nav (Map · Search · Add · Profile).

- **Map** (`/`): pitched 3D Seville map, emoji pins per place, clustering, tap pin → preview card (name, rating, price, review count, photo) → place detail
- **Place detail** (`/place/[id]`): hero, avg rating, price, all reviews, add-review
- **Review detail** (`/review/[id]`): photos, rating, price, dishes, text, creator preview, date; owner can edit/delete
- **Create review** (`/create`): place, location, rating, price, dishes, multiple photo URLs, tags
- **Creator profile** (`/profile/[username]`): bio, city, counts, reviews, follow/unfollow
- **Search** (`/search`): by name/city + category & rating filters

Data: local-first store (`lib/store.ts`) seeded with Seville data (`lib/seed.ts`), persisted to `localStorage`. Mock auth via a current user (switch on your own profile to test follows).

See `MVP_AUDIT.md` for architecture and `supabase/migrations/0001_init.sql` for the production schema.

## Next

- Swap `lib/store.ts` queries for Supabase (schema ready in `supabase/migrations`)
- Real auth + Supabase Storage photo upload
- Realtime pin subscription; Mapbox geocoding for place location
- Premium creator profiles (data model extension point)
