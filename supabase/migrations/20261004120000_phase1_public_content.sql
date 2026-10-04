-- =============================================================================
-- Phase 1 — public content schema
--
-- The subset of database.md the public website needs: settings, services,
-- products, portfolio_items, posts, messages and events, plus the enums they
-- depend on and the public_settings view.
--
-- clients, projects, project_tasks, reminders, income, expenses and
-- expense_categories are Phase 3 and are deliberately absent. profiles and the
-- is_owner() helper arrive in Phase 2 with Supabase Auth.
--
-- RLS ships in the same migration as the tables it protects (workflows.md A3).
-- Phase 1 grants the anon role only what the public site needs: read published
-- content, insert a contact message, insert an analytics event. Private tables
-- do not exist yet, and every table here is deny-by-default for everyone else
-- until the owner policies land in Phase 2.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums (database.md 3). Only those the Phase 1 tables reference.
-- -----------------------------------------------------------------------------
create type post_status    as enum ('draft', 'published');
create type message_status as enum ('new', 'replied', 'closed');
create type event_type     as enum ('page_view', 'whatsapp_click', 'contact_submit');
create type product_badge  as enum ('none', 'coming_soon', 'new', 'popular');

-- -----------------------------------------------------------------------------
-- updated_at trigger (database.md 8)
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
-- Empty search_path: this runs on every write, so it must not be hijackable by
-- a schema earlier on someone else's search_path.
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- settings — single row, site-wide configuration (database.md 4.2)
-- -----------------------------------------------------------------------------
create table public.settings (
  id                        boolean primary key default true,
  company_name              text not null default 'OSP Technologies',
  tagline                   text not null default 'Turning Ideas Into Digital Solutions.',
  whatsapp_number           text,
  phone                     text,
  email                     text,
  location                  text,
  socials                   jsonb not null default '{}'::jsonb,
  trust_stats               jsonb not null default '[]'::jsonb,
  default_whatsapp_greeting text,
  -- Sensitive/internal fields may be added here later; the public site reads
  -- the public_settings view, never this table, so they stay unexposed.
  updated_at                timestamptz not null default now(),
  -- The check is what makes this a singleton: id can only ever be true.
  constraint settings_singleton check (id)
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- services (database.md 4.3)
-- -----------------------------------------------------------------------------
create table public.services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  icon             text,
  short_desc       text,
  full_desc        text,
  whatsapp_message text,
  sort_order       int not null default 0,
  visible          boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index services_visible_sort_idx
  on public.services (sort_order) where visible;

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- products (database.md 4.4)
-- -----------------------------------------------------------------------------
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text,
  features         jsonb not null default '[]'::jsonb,
  images           jsonb not null default '[]'::jsonb,
  pricing_text     text,
  badge            product_badge not null default 'none',
  whatsapp_message text,
  sort_order       int not null default 0,
  visible          boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index products_visible_sort_idx
  on public.products (sort_order) where visible;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- portfolio_items (database.md 4.5)
-- -----------------------------------------------------------------------------
create table public.portfolio_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  type         text,
  description  text,
  images       jsonb not null default '[]'::jsonb,
  technologies jsonb not null default '[]'::jsonb,
  live_url     text,
  sort_order   int not null default 0,
  visible      boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index portfolio_items_visible_sort_idx
  on public.portfolio_items (sort_order) where visible;

create trigger portfolio_items_set_updated_at
  before update on public.portfolio_items
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- posts (database.md 4.6)
-- -----------------------------------------------------------------------------
create table public.posts (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  cover_image      text,
  summary          text,
  -- Tiptap document, stored as structured JSON and never as HTML, so there is
  -- no stored-XSS surface on render (security.md 4).
  body             jsonb,
  status           post_status not null default 'draft',
  published_at     timestamptz,
  meta_title       text,
  meta_description text,
  -- FK to profiles.id is added in the Phase 2 migration, when that table
  -- exists. Left unconstrained here rather than editing a shipped migration.
  author_id        uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- A published post must carry its publication date; the public list orders
  -- by it, so a null here would silently drop the post.
  constraint posts_published_has_date
    check (status <> 'published' or published_at is not null)
);

create index posts_status_published_at_idx
  on public.posts (status, published_at desc);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- messages — contact form (database.md 4.14)
-- -----------------------------------------------------------------------------
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  need        text,
  message     text not null,
  status      message_status not null default 'new',
  source_page text,
  created_at  timestamptz not null default now()
);

create index messages_status_created_at_idx
  on public.messages (status, created_at desc);

-- -----------------------------------------------------------------------------
-- events — analytics, append-only (database.md 4.15)
-- -----------------------------------------------------------------------------
create table public.events (
  id         uuid primary key default gen_random_uuid(),
  type       event_type not null,
  page       text,
  item       text,
  created_at timestamptz not null default now()
);

create index events_type_created_at_idx
  on public.events (type, created_at desc);

-- -----------------------------------------------------------------------------
-- public_settings — the only settings the anon role may see (database.md 4.2)
--
-- security_invoker = off so the view reads the base table under its owner's
-- rights; the anon role is granted the view and never the table, so the
-- column list below is the whole of what the public can reach.
-- -----------------------------------------------------------------------------
create view public.public_settings
with (security_invoker = off) as
  select
    company_name,
    tagline,
    whatsapp_number,
    phone,
    email,
    location,
    socials,
    trust_stats,
    default_whatsapp_greeting
  from public.settings
  where id;

-- =============================================================================
-- Row-Level Security (security.md 3, database.md 5)
-- =============================================================================

alter table public.settings        enable row level security;
alter table public.services        enable row level security;
alter table public.products        enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.posts           enable row level security;
alter table public.messages        enable row level security;
alter table public.events          enable row level security;

-- settings: no anon policy at all. The public reads public_settings instead,
-- so even a new sensitive column is unreachable by default.

-- Published / visible content is readable by the public.
create policy services_public_read on public.services
  for select to anon using (visible);

create policy products_public_read on public.products
  for select to anon using (visible);

create policy portfolio_items_public_read on public.portfolio_items
  for select to anon using (visible);

create policy posts_public_read on public.posts
  for select to anon using (status = 'published');

-- The contact form may INSERT and may never SELECT: a visitor must not be able
-- to read other visitors' messages.
create policy messages_anon_insert on public.messages
  for insert to anon with check (true);

-- Analytics is write-only for the public.
create policy events_anon_insert on public.events
  for insert to anon with check (true);

-- Grants. RLS narrows what a role can reach, but only after the grant lets it
-- reach the table at all, so both layers are set explicitly.
grant select on public.public_settings to anon;
grant select on public.services, public.products, public.portfolio_items, public.posts to anon;
grant insert on public.messages, public.events to anon;
