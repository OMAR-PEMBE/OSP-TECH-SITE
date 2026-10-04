-- =============================================================================
-- Phase 2 — authentication, ownership and admin access
--
-- Adds the `profiles` table that carries roles, the `is_owner()` helper the
-- policies depend on, and the owner-side RLS policies for every table Phase 1
-- created. Phase 1 deliberately shipped anon policies only; this is the other
-- half of the two-layer model (security.md 3).
--
-- Also creates the two Storage buckets and their policies, and finally adds
-- the posts.author_id foreign key that Phase 1 left unconstrained because
-- `profiles` did not exist yet — as a new migration, never by editing the
-- shipped one (workflows.md A3).
-- =============================================================================

create type user_role as enum ('owner', 'staff');

-- -----------------------------------------------------------------------------
-- profiles — mirror of auth.users carrying role and display info
-- -----------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  email      text unique,
  role       user_role not null default 'owner',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- is_owner() — the predicate every owner policy is built on (security.md 3)
--
-- SECURITY DEFINER so the policy can read `profiles` without the caller
-- needing its own SELECT grant. Without it, a policy on `profiles` that calls
-- is_owner() would recurse into the policy that is being evaluated.
--
-- `search_path = ''` and fully-qualified names: a SECURITY DEFINER function
-- that resolves names through the caller's search_path is the classic
-- privilege-escalation hole.
-- -----------------------------------------------------------------------------
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'owner'
  );
$$;

revoke execute on function public.is_owner() from public;
grant execute on function public.is_owner() to authenticated;

-- -----------------------------------------------------------------------------
-- handle_new_user() — create a profile whenever an auth user is created
--
-- The first account to exist becomes the owner; any later one defaults to
-- staff, so an accidental extra signup cannot silently gain full access.
-- There is no public sign-up route, so in practice this runs once
-- (security.md 2).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.profiles) into is_first;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when is_first then 'owner'::public.user_role
         else 'staff'::public.user_role end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.profiles enable row level security;

-- Anyone signed in may read their own row; the owner may read and manage all.
create policy profiles_self_read on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_owner());

create policy profiles_owner_manage on public.profiles
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- Owner gets full control of every content table. The anon policies from
-- Phase 1 are untouched and still the only thing the public can do.
create policy services_owner_all on public.services
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy products_owner_all on public.products
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy portfolio_items_owner_all on public.portfolio_items
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy posts_owner_all on public.posts
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy settings_owner_all on public.settings
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy messages_owner_all on public.messages
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Analytics is read-only even for the owner: rows are an append-only record,
-- and nothing in the product has a reason to edit or delete one.
create policy events_owner_read on public.events
  for select to authenticated using (public.is_owner());

grant select, insert, update, delete
  on public.services, public.products, public.portfolio_items,
     public.posts, public.settings, public.messages, public.profiles
  to authenticated;

grant select on public.events to authenticated;
grant select on public.public_settings to authenticated;

-- -----------------------------------------------------------------------------
-- posts.author_id → profiles.id
--
-- Deferred from the Phase 1 migration, which could not reference a table that
-- did not exist. `on delete set null` so removing a profile never destroys
-- published content.
-- -----------------------------------------------------------------------------
alter table public.posts
  add constraint posts_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete set null;

-- =============================================================================
-- Storage buckets (database.md 6, security.md 8)
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media', 'public-media', true, 5242880,
   array['image/png','image/jpeg','image/webp','image/avif','image/svg+xml']),
  ('private-media', 'private-media', false, 10485760,
   array['image/png','image/jpeg','image/webp','image/avif','application/pdf'])
on conflict (id) do nothing;

-- public-media: world-readable, owner-writable. Portfolio shots and post
-- covers have to be fetchable by any visitor, so read is open by design.
create policy public_media_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'public-media');

create policy public_media_owner_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'public-media' and public.is_owner());

create policy public_media_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'public-media' and public.is_owner());

create policy public_media_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'public-media' and public.is_owner());

-- private-media: no anon policy at all. Receipts and contracts are reachable
-- only by the owner, and only through a short-lived signed URL.
create policy private_media_owner_all on storage.objects
  for all to authenticated
  using (bucket_id = 'private-media' and public.is_owner())
  with check (bucket_id = 'private-media' and public.is_owner());
