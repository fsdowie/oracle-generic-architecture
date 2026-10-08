-- Migration 003: self-registration, admin role, per-user map access, comments, live activity log.
-- Run once in the Supabase SQL editor (after 002-per-map-access.sql). Safe to re-run.
--
-- Model
--   profiles      one row per Auth user: status (pending | active | disabled), maps, is_admin.
--                 Created automatically when someone registers (trigger on auth.users).
--   comments      comments viewers submit on a map item; written by the estate-comment Edge Function.
--   activity_log  registrations, sign-ins, map opens, comments; the admin watches it live.
-- Map access: a signed-in user can read <map>/map.json when their profile is active and lists the map
-- (or '*'), or they are an admin. The older email allow-list (map_viewers) keeps working alongside.

-- 1. Profiles
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  organisation  text,
  status        text not null default 'pending' check (status in ('pending', 'active', 'disabled')),
  maps          text[] not null default '{}',
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now(),
  approved_at   timestamptz,
  notified_at   timestamptz,
  last_seen_at  timestamptz
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon;

-- 2. Activity log and comments
create table if not exists public.activity_log (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  user_id  uuid references auth.users(id) on delete set null,
  email    text,
  event    text not null,
  detail   text
);
alter table public.activity_log enable row level security;
revoke all on public.activity_log from anon;

create table if not exists public.comments (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users(id) on delete set null,
  email       text,
  map         text not null,
  tab         text,
  item_id     text,
  item_title  text,
  body        text not null check (char_length(body) between 1 and 4000),
  status      text not null default 'new' check (status in ('new', 'accepted', 'rejected')),
  emailed     boolean not null default false
);
alter table public.comments enable row level security;
revoke all on public.comments from anon;

-- 3. Helpers (SECURITY DEFINER so policies can read profiles the caller cannot)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.is_admin and p.status = 'active');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.can_read_map(map text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
           select 1 from public.profiles p
           where p.id = auth.uid() and p.status = 'active'
             and (p.is_admin or map = any (p.maps) or '*' = any (p.maps)))
      or exists (
           select 1 from public.map_viewers v
           where lower(v.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
             and (map = any (v.maps) or '*' = any (v.maps)));
$$;
revoke all on function public.can_read_map(text) from public, anon;
grant execute on function public.can_read_map(text) to authenticated;

-- 4. New Auth user → pending profile + "registered" event
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, organisation)
  values (new.id, lower(new.email),
          nullif(new.raw_user_meta_data ->> 'display_name', ''),
          nullif(new.raw_user_meta_data ->> 'organisation', ''))
  on conflict (id) do nothing;
  insert into public.activity_log (user_id, email, event, detail)
  values (new.id, lower(new.email), 'registered', nullif(new.raw_user_meta_data ->> 'organisation', ''));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Existing Auth users (created before this migration) get a profile too
insert into public.profiles (id, email, status, approved_at)
select u.id, lower(u.email), 'active', now() from auth.users u
on conflict (id) do nothing;

-- 5. Policies
drop policy if exists "profiles: own row" on public.profiles;
create policy "profiles: own row" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "activity: admin reads" on public.activity_log;
create policy "activity: admin reads" on public.activity_log for select to authenticated
  using (public.is_admin());
drop policy if exists "activity: users log their own" on public.activity_log;
create policy "activity: users log their own" on public.activity_log for insert to authenticated
  with check (user_id = auth.uid() and event in ('signed_in', 'opened_map'));

drop policy if exists "comments: admin reads" on public.comments;
create policy "comments: admin reads" on public.comments for select to authenticated
  using (public.is_admin());
-- Comments are inserted and updated only by Edge Functions (secret key).

grant select on public.profiles, public.comments, public.activity_log to authenticated;
grant insert on public.activity_log to authenticated;

drop policy if exists "estate-map: per-map read" on storage.objects;
create policy "estate-map: per-map read" on storage.objects for select to authenticated
  using (bucket_id = 'estate-map' and public.can_read_map(split_part(name, '/', 1)));

-- 6. Live log for the admin panel
do $$ begin
  alter publication supabase_realtime add table public.activity_log;
exception when duplicate_object then null; end $$;

-- 7. The admin. Register (or create the Auth user) with this email first, then run this line.
update public.profiles set is_admin = true, status = 'active', maps = '{*}', approved_at = coalesce(approved_at, now())
where email = 'fsdowie@gmail.com';
