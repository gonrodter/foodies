-- Geoapify provider support for places.
-- Adds provider columns without breaking existing rows/coords (keeps lat/lng).
-- Run in Supabase SQL Editor.

alter table places
  add column if not exists provider            text not null default 'geoapify',
  add column if not exists provider_place_id   text,
  add column if not exists formatted_address   text,
  add column if not exists address_line1       text,
  add column if not exists address_line2       text,
  add column if not exists state               text,
  add column if not exists country             text,
  add column if not exists postcode            text,
  add column if not exists categories          text[],
  add column if not exists raw_provider_data   jsonb,
  add column if not exists verification_status text default 'provider_verified',
  add column if not exists updated_at          timestamptz not null default now();

-- Existing seed/manual places are not from Geoapify.
update places set provider = 'seed' where provider_place_id is null;

-- One row per external place. Partial so legacy rows (null provider_place_id) are exempt.
create unique index if not exists places_provider_uidx
  on places (provider, provider_place_id)
  where provider_place_id is not null;

-- RLS write policies for places (insert + update) for the MVP anon flow.
-- (select policy already exists from policies.sql)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='places' and policyname='places update') then
    create policy "places update" on places for update using (true);
  end if;
end $$;
