-- Foody MVP schema (production data model).
-- The app currently runs on a local-first store (lib/store.ts); this migration
-- mirrors that shape so queries can be swapped to Supabase without UI changes.
-- Run with the Supabase CLI: `supabase db push` (requires PostGIS extension).

create extension if not exists postgis;

-- ---- profiles ----
create table if not exists profiles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  username    text not null unique,
  avatar_url  text,
  bio         text,
  city        text,
  created_at  timestamptz not null default now()
);

-- ---- places ----
create table if not exists places (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  city        text not null,
  lat         double precision not null,
  lng         double precision not null,
  category    text not null check (category in ('food','coffee','bar','dessert','other')),
  geog        geography(point, 4326) generated always as (st_point(lng, lat)::geography) stored,
  created_at  timestamptz not null default now()
);
create index if not exists places_geog_idx on places using gist (geog);
create index if not exists places_city_idx on places (city);

-- ---- reviews ----
create table if not exists reviews (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  place_id         uuid not null references places(id) on delete cascade,
  rating           int not null check (rating between 1 and 5),
  price_per_person numeric,
  dishes           text[] not null default '{}',
  text             text not null,
  photos           text[] not null default '{}',
  tags             text[] not null default '{}',
  emoji            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists reviews_place_idx on reviews (place_id);
create index if not exists reviews_user_idx on reviews (user_id);

-- ---- follows ----
create table if not exists follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on follows (following_id);

-- Row Level Security (enable when wiring real auth)
-- alter table reviews enable row level security;
-- create policy "own review write" on reviews
--   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy "reviews readable" on reviews for select using (true);
