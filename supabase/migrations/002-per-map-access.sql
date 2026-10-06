-- Migration: one map → per-map access (Travel + Insurance).
-- Run once in the Supabase SQL editor after the first deploy that uploads travel/map.json and insurance/map.json.
-- Until this runs, every allow-listed viewer can read every map in the bucket.

-- 1. Which maps each viewer may open. Existing viewers keep Travel only.
alter table public.map_viewers add column if not exists maps text[] not null default '{travel}';
revoke all on public.map_viewers from anon, authenticated;

-- 2. Per-map check.
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

-- 3. Replace the whole-bucket policy with the per-map one (map id = first folder of the path).
drop policy if exists "estate-map: allow-listed read" on storage.objects;
drop policy if exists "estate-map: per-map read" on storage.objects;
create policy "estate-map: per-map read"
on storage.objects
for select
to authenticated
using (bucket_id = 'estate-map' and public.can_read_map(split_part(name, '/', 1)));

-- 4. The owner sees every map.
update public.map_viewers set maps = '{*}' where email = 'fsdowie@yahoo.com';

-- 5. The old single-map function is no longer used.
drop function if exists public.is_map_viewer();

-- Check (should list the per-map policy only):
-- select policyname, roles, qual from pg_policies where schemaname = 'storage' and tablename = 'objects';
