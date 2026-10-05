-- Estate map: private storage + allow-list.
-- Run once in the Supabase SQL editor of the NEW project created for the map
-- (not the vaireferee project).

-- 1. Private bucket that holds map.json. public = false means no anonymous URLs.
insert into storage.buckets (id, name, public)
values ('estate-map', 'estate-map', false)
on conflict (id) do update set public = false;

-- 2. Who may read the map. Add one row per person.
create table if not exists public.map_viewers (
  email      text primary key,
  added_at   timestamptz not null default now(),
  note       text
);
alter table public.map_viewers enable row level security;
-- No policies on map_viewers: browsers can never read or change the list.
-- Manage it here in the SQL editor (or the Table editor) as the project owner.

-- 3. Check used by the storage policy. SECURITY DEFINER lets it read the
--    allow-list even though the signed-in user cannot.
create or replace function public.is_map_viewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.map_viewers v
    where lower(v.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_map_viewer() from public;
grant execute on function public.is_map_viewer() to authenticated;

-- 4. Only signed-in, allow-listed users may download objects from the bucket.
drop policy if exists "estate-map: allow-listed read" on storage.objects;
create policy "estate-map: allow-listed read"
on storage.objects
for select
to authenticated
using (bucket_id = 'estate-map' and public.is_map_viewer());
-- No insert/update/delete policies: only the service-role key used by
-- GitHub Actions can write map.json.

-- 5. Add yourself (replace with the email of the user you create in Auth).
insert into public.map_viewers (email, note)
values ('fsdowie@yahoo.com', 'owner')
on conflict (email) do nothing;
