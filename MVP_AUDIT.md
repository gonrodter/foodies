# MVP Audit — Foody (Seville)

## Tech stack (verified)

- Next.js 14 App Router, React 18, TypeScript
- Mapbox GL via `react-map-gl`, clustering via `supercluster` / `use-supercluster`
- Supabase JS client wired in `lib/supabase.ts` but **optional** — returns `null` until env vars set. **No tables, no auth, no queries exist yet.**
- Styling: CSS Modules + `app/globals.css` (CSS variables: `--ink`, `--accent`, `--good`, `--card`, shadows)
- App currently runs 100% on client-side **mock data** (`lib/mockReviews.ts`)

## What already exists

| Area | State |
|------|-------|
| Map screen (`/`) | ✅ `components/FoodMap.tsx` — pitched 3D map, emoji pins, clustering, tap pin → floating card, tap cluster → zoom |
| Data model | ⚠️ Flat `Review` only (`lib/types.ts`): place name + author as strings, no Place/User/Follow entities |
| Mock data | ✅ 10 Seville reviews |
| Supabase client | ⚠️ Stub only, optional |
| Routes | ⚠️ Only `/` |
| Auth | ❌ None |
| Create review | ❌ None |
| Review detail | ❌ None |
| Place detail | ❌ None |
| Creator profile | ❌ None |
| Follow | ❌ None |
| Search/filter | ❌ None |
| Bottom nav | ❌ None |

## What is missing (MVP gap)

Everything except the map: normalized data model, create-review flow, review/place/profile screens, follow, search, bottom nav, persistence, user state.

## Approach decision

The backend (Supabase) is optional and empty. Standing up real Supabase auth + Postgres requires the user to own a project and set keys — too heavy for a verifiable local MVP, and the task explicitly permits a simpler architecture that "does not block adding auth later."

**Chosen:** a client-side data layer (`lib/store.ts`) that:
- Normalizes data into `User`, `Place`, `Review`, `Follow`
- Seeds from realistic Seville data
- Persists user-created reviews/follows + "current user" to `localStorage`
- Exposes CRUD + query helpers (by place, by user, search) that mirror what Supabase queries will later return

Auth = **mock current user** (selectable creator) stored locally. Reviews associate to current user; only owner can edit/delete. This keeps the data shapes identical to a future Supabase schema — swapping the store for real queries is isolated to one module. A ready-to-run `supabase/migrations/0001_init.sql` is included as the production data-model deliverable.

## Data model (new `lib/types.ts`)

- `User`: id, name, username, avatarUrl, bio, city, createdAt
- `Place`: id, name, address, city, lat, lng, category, createdAt
- `Review`: id, userId, placeId, rating, pricePerPerson, dishes[], text, photos[], tags[], emoji, createdAt, updatedAt
- `Follow`: followerId, followingId, createdAt
- Derived: place average rating, review count, price range, follower/following counts

## Proposed routes (App Router)

- `/` — map (refactored to read from store, pins per Place)
- `/create` — create review flow
- `/place/[id]` — place detail + all reviews + add-review
- `/review/[id]` — review detail
- `/profile/[username]` — creator profile + follow
- `/search` — search places / filter by city, price, rating, tag
- Shared `BottomNav` (Map · Create · Profile)

## Files to be created/changed

Created: `lib/types.ts` (rewrite), `lib/store.ts`, `lib/seed.ts`, `components/BottomNav.tsx`, `components/PlaceCard.tsx`, `components/ReviewCard.tsx`, `components/Stars.tsx`, `app/create/page.tsx`, `app/place/[id]/page.tsx`, `app/review/[id]/page.tsx`, `app/profile/[username]/page.tsx`, `app/search/page.tsx`, `supabase/migrations/0001_init.sql`, related CSS modules.
Changed: `components/FoodMap.tsx`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `README.md`.
Removed/replaced: `lib/mockReviews.ts` → folded into `lib/seed.ts`.

## Assumptions

- Local-first MVP acceptable; no real auth/Stripe (per spec).
- Photos: store as URLs/data-URLs; model supports multiple. Create flow accepts photo URLs (file upload needs storage backend = out of scope, noted).
- Mapbox token still required to render the map (unchanged).
- "Following someone's taste" surfaced via profile + follow; no feed/DMs/comments (excluded per spec).

## Out of scope (per spec)

Payments, paywalls, subscriptions, comments, DMs, notifications, activity feeds, real file upload/storage, recommendation algorithms.
