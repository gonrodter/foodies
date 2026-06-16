-- MVP policies: RLS enabled, no real auth yet (anon key only).
-- Public read everywhere; public write so the create-review / follow flows work.
-- TIGHTEN once real Supabase Auth is wired (replace write policies with
-- auth.uid() = user_id checks — see commented block in 0001_init.sql).

-- profiles
create policy "profiles read"  on profiles for select using (true);
create policy "profiles write" on profiles for insert with check (true);
create policy "profiles update" on profiles for update using (true);

-- places
create policy "places read"  on places for select using (true);
create policy "places write" on places for insert with check (true);

-- reviews
create policy "reviews read"   on reviews for select using (true);
create policy "reviews insert" on reviews for insert with check (true);
create policy "reviews update" on reviews for update using (true);
create policy "reviews delete" on reviews for delete using (true);

-- follows
create policy "follows read"   on follows for select using (true);
create policy "follows insert" on follows for insert with check (true);
create policy "follows delete" on follows for delete using (true);
