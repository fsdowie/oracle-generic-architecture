-- Estate maps: private storage + per-map allow-list.
-- Run once in the Supabase SQL editor of the project created for the maps
-- (not the vaireferee project). Safe to re-run.
-- Already set up with the single-map version? Run supabase/migrations/002-per-map-access.sql instead.

-- 1. Private bucket. Each map is one object: <map>/map.json (travel/map.json, insurance/map.json).
insert into storage.buckets (id, name, public)
values ('estate-map', 'estate-map', false)
on conflict (id) do update set public = false;

-- 2. Who may read which map. One row per person; maps lists the map ids they can open ('*' = all).
create table if not exists public.map_viewers (
  email      text primary key,
  added_at   timestamptz not null default now(),
  note       text,
  maps       text[] not null default '{travel}'
);
alter table public.map_viewers enable row level security;
revoke all on public.map_viewers from anon, authenticated;
-- No policies on map_viewers: browsers can never read or change the list.

-- 3. Check used by the storage policy. SECURITY DEFINER lets it read the
--    allow-list even though the signed-in user cannot.
create or replace function public.can_read_map(map text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.map_viewers v
    where lower(v.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and (map = any (v.maps) or '*' = any (v.maps))
  );
$$;
revoke all on function public.can_read_map(text) from public, anon;
grant execute on function public.can_read_map(text) to authenticated;

-- 4. Signed-in users may download a map's object only if they are allow-listed for that map.
--    The map id is the first folder of the object path.
drop policy if exists "estate-map: allow-listed read" on storage.objects;
drop policy if exists "estate-map: per-map read" on storage.objects;
create policy "estate-map: per-map read"
on storage.objects
for select
to authenticated
using (bucket_id = 'estate-map' and public.can_read_map(split_part(name, '/', 1)));
-- No insert/update/delete policies: only the secret key used by GitHub Actions can write.

-- 5. Add yourself with access to every map.
insert into public.map_viewers (email, note, maps)
values ('fsdowie@yahoo.com', 'owner', '{*}')
on conflict (email) do update set maps = '{*}';

-- Give someone one map:   insert into public.map_viewers (email, note, maps) values ('person@example.com', 'reviewer', '{insurance}');
-- Add a map to a person:  update public.map_viewers set maps = array_append(maps, 'insurance') where email = 'person@example.com';
