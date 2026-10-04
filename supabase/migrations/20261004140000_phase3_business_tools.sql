-- =============================================================================
-- Phase 3 — business tools
--
-- Clients, projects, tasks, reminders and finance (database.md 4.7-4.13).
--
-- Every table here is owner-only: there is NO anon policy on any of them, so
-- the public role sees nothing, by default-deny rather than by a rule that
-- could be mis-written (security.md 3). This is the private half of the
-- database — finance and client data — and it never touches the public site.
--
-- Money is `bigint` whole TZS throughout. No floats anywhere near an amount
-- (agents.md 2.6).
-- =============================================================================

create type project_type   as enum ('custom_system','website','system_rental','automation','ai','other');
create type project_status as enum ('planning','in_progress','testing','completed','on_hold','cancelled');
create type payment_method as enum ('mpesa','mixx_tigo','airtel_money','halopesa','bank','cash','other');
create type reminder_repeat as enum ('none','daily','weekly','monthly');

-- -----------------------------------------------------------------------------
-- clients (database.md 4.7)
-- -----------------------------------------------------------------------------
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text,
  email         text,
  business_name text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index clients_name_idx on public.clients (lower(name));

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- projects (database.md 4.8)
-- -----------------------------------------------------------------------------
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  client_id   uuid references public.clients (id) on delete set null,
  type        project_type not null default 'other',
  description text,
  -- Agreed price in whole TZS. Never negative.
  price       bigint not null default 0 check (price >= 0),
  start_date  date,
  deadline    date,
  status      project_status not null default 'planning',
  notes       text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index projects_status_idx   on public.projects (status) where not archived;
create index projects_deadline_idx on public.projects (deadline) where not archived;
create index projects_client_idx   on public.projects (client_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- project_tasks (database.md 4.9)
-- -----------------------------------------------------------------------------
create table public.project_tasks (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title      text not null,
  done       boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index project_tasks_project_idx on public.project_tasks (project_id, sort_order);

-- -----------------------------------------------------------------------------
-- reminders (database.md 4.10)
-- -----------------------------------------------------------------------------
create table public.reminders (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  due_at      timestamptz not null,
  repeat_rule reminder_repeat not null default 'none',
  project_id  uuid references public.projects (id) on delete set null,
  client_id   uuid references public.clients (id) on delete set null,
  done        boolean not null default false,
  notify_email boolean not null default true,
  -- Last email sent, so the cron job cannot send the same reminder twice.
  notified_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index reminders_due_idx on public.reminders (done, due_at);

create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- expense_categories (database.md 4.11)
-- -----------------------------------------------------------------------------
create table public.expense_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order int not null default 0
);

-- -----------------------------------------------------------------------------
-- expenses (database.md 4.12)
-- -----------------------------------------------------------------------------
create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  date        date not null default current_date,
  amount      bigint not null check (amount >= 0),
  category_id uuid references public.expense_categories (id) on delete set null,
  method      payment_method not null default 'cash',
  description text,
  -- Path in the PRIVATE bucket. The binary never goes in the database, and
  -- the file is only reachable through a short-lived signed URL.
  receipt_url text,
  recurring   reminder_repeat not null default 'none',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index expenses_date_idx     on public.expenses (date desc);
create index expenses_category_idx on public.expenses (category_id);

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- income (database.md 4.13)
-- -----------------------------------------------------------------------------
create table public.income (
  id         uuid primary key default gen_random_uuid(),
  date       date not null default current_date,
  amount     bigint not null check (amount >= 0),
  client_id  uuid references public.clients (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  method     payment_method not null default 'mpesa',
  reference  text,
  category   text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index income_date_idx    on public.income (date desc);
create index income_project_idx on public.income (project_id);
create index income_client_idx  on public.income (client_id);

create trigger income_set_updated_at
  before update on public.income
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS — owner only, every table, no anon policy anywhere
-- =============================================================================

alter table public.clients            enable row level security;
alter table public.projects           enable row level security;
alter table public.project_tasks      enable row level security;
alter table public.reminders          enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses           enable row level security;
alter table public.income             enable row level security;

create policy clients_owner_all on public.clients
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy projects_owner_all on public.projects
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy project_tasks_owner_all on public.project_tasks
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy reminders_owner_all on public.reminders
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy expense_categories_owner_all on public.expense_categories
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy expenses_owner_all on public.expenses
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy income_owner_all on public.income
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

grant select, insert, update, delete
  on public.clients, public.projects, public.project_tasks, public.reminders,
     public.expense_categories, public.expenses, public.income
  to authenticated;

-- Deliberately NO grant to anon on any table in this migration.

-- =============================================================================
-- Monthly finance view (database.md 8)
--
-- security_invoker = on so the view is evaluated as the querying user and the
-- RLS policies above still apply. With it off, this view would be a hole
-- straight through them.
-- =============================================================================
create view public.v_monthly_finance
with (security_invoker = on) as
  with months as (
    select date_trunc('month', d)::date as month
    from generate_series(
      date_trunc('month', current_date) - interval '11 months',
      date_trunc('month', current_date),
      interval '1 month'
    ) as d
  )
  select
    m.month,
    coalesce((
      select sum(i.amount) from public.income i
      where date_trunc('month', i.date)::date = m.month
    ), 0)::bigint as income_total,
    coalesce((
      select sum(e.amount) from public.expenses e
      where date_trunc('month', e.date)::date = m.month
    ), 0)::bigint as expense_total,
    (
      coalesce((
        select sum(i.amount) from public.income i
        where date_trunc('month', i.date)::date = m.month
      ), 0)
      -
      coalesce((
        select sum(e.amount) from public.expenses e
        where date_trunc('month', e.date)::date = m.month
      ), 0)
    )::bigint as profit
  from months m
  order by m.month;

grant select on public.v_monthly_finance to authenticated;

-- =============================================================================
-- Hardening: revoke the privileges Supabase grants by default
--
-- A stock Supabase project ships
--   `alter default privileges in schema public grant all on tables to anon`
-- so every table created above silently receives SELECT (and more) for the
-- public role. Nothing leaks today, because RLS is enabled with no anon
-- policy and therefore returns zero rows — verified directly.
--
-- But that leaves RLS as the *only* thing between the public and the
-- business's finances. If a policy were ever added carelessly, or RLS
-- disabled on a table during debugging, the grant would be all that remained.
-- Taking the grant away as well means two independent things must fail before
-- anything is exposed, which is the point of the two-layer model
-- (security.md 3).
-- =============================================================================

revoke all on public.clients            from anon;
revoke all on public.projects           from anon;
revoke all on public.project_tasks      from anon;
revoke all on public.reminders          from anon;
revoke all on public.expense_categories from anon;
revoke all on public.expenses           from anon;
revoke all on public.income             from anon;
revoke all on public.v_monthly_finance  from anon;

-- Same reasoning for the private parts of the earlier phases: settings is
-- read through the public_settings view, and messages is insert-only for the
-- public, so anon needs no SELECT on either table.
revoke all     on public.settings from anon;
revoke select, update, delete on public.messages from anon;
revoke select, update, delete on public.events   from anon;
revoke all     on public.profiles from anon;

-- Re-grant exactly what the public site needs and nothing else.
grant insert on public.messages to anon;
grant insert on public.events   to anon;
