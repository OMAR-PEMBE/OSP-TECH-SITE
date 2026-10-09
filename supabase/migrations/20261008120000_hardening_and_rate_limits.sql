-- =============================================================================
-- Hardening + shared rate limits
--
-- 1. Closes a write path through the `public_settings` view.
-- 2. Finishes the default-privilege revocation Phase 3 started, for the public
--    content tables.
-- 3. Adds a database-backed rate-limit counter, replacing the per-instance
--    in-memory limiter (API.md 6) before the site carries real traffic.
--
-- A new migration, never an edit to a shipped one (workflows.md A3).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. public_settings must be read-only for everyone
--
-- Supabase's default privileges grant ALL on every new table *and view* in
-- `public` to anon and authenticated. Phase 1 added an explicit SELECT, but
-- the defaults had already granted INSERT/UPDATE/DELETE too.
--
-- That matters here specifically: public_settings is a simple single-table
-- view, which Postgres makes automatically updatable, and it is
-- `security_invoker = off`, so a write through it runs with the view owner's
-- rights — and the owner bypasses RLS on `settings`. An anonymous
-- `PATCH /rest/v1/public_settings` could therefore rewrite the WhatsApp number
-- every lead is sent to. Revoking everything and re-granting SELECT is the
-- fix; `security_barrier` is added so no leaky predicate can see past the
-- view's own filter either.
-- -----------------------------------------------------------------------------
revoke all on public.public_settings from anon, authenticated;
grant select on public.public_settings to anon, authenticated;

alter view public.public_settings set (security_barrier = true);

-- -----------------------------------------------------------------------------
-- 2. Public content tables: anon reads, nothing else
--
-- RLS already refuses anon writes here (there is no anon INSERT/UPDATE/DELETE
-- policy), but the default grant meant RLS was the only wall. Phase 3 removed
-- the grant on every private table for exactly this reason; this does the
-- same for the public ones, so a mistakenly added policy or a table with RLS
-- toggled off during debugging still cannot be written by the public.
-- -----------------------------------------------------------------------------
revoke all on public.services        from anon;
revoke all on public.products        from anon;
revoke all on public.portfolio_items from anon;
revoke all on public.posts           from anon;

grant select on public.services, public.products, public.portfolio_items, public.posts to anon;

-- -----------------------------------------------------------------------------
-- 3. Rate limits (API.md 6)
--
-- Fixed-window counters keyed by e.g. `contact:<ip>`. One row per key per
-- window; the upsert makes the increment atomic across every serverless
-- instance, which an in-memory Map cannot be.
--
-- No RLS policy and no grants to anon/authenticated at all: the table is
-- reachable only through `rate_limit_hit`, and that function only by the
-- service role. If the public could call it, anyone could inflate another
-- visitor's counter (locking them out of the contact form or login) or bloat
-- the table with junk keys.
-- -----------------------------------------------------------------------------
create table public.rate_limit_counters (
  key          text        not null,
  window_start timestamptz not null,
  count        int         not null default 0,
  primary key (key, window_start)
);

-- Sweeps delete by age across all keys.
create index rate_limit_counters_window_idx
  on public.rate_limit_counters (window_start);

alter table public.rate_limit_counters enable row level security;
revoke all on public.rate_limit_counters from anon, authenticated;

create or replace function public.rate_limit_hit(
  p_key            text,
  p_limit          int,
  p_window_seconds int
)
returns table (allowed boolean, retry_after_seconds int)
language plpgsql
security definer
-- Empty search_path and qualified names: the standard SECURITY DEFINER guard.
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count        int;
begin
  if p_key is null or length(p_key) > 200
     or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'rate_limit_hit: invalid arguments';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_counters as c (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start)
    do update set count = c.count + 1
  returning c.count into v_count;

  -- Opportunistic sweep: about one call in a hundred clears windows older
  -- than the longest rule (one day) — no cron needed to keep the table small.
  if random() < 0.01 then
    delete from public.rate_limit_counters
    where window_start < now() - interval '2 days';
  end if;

  return query
    select
      v_count <= p_limit,
      greatest(
        0,
        ceil(extract(epoch from (
          v_window_start + make_interval(secs => p_window_seconds) - now()
        )))::int
      );
end;
$$;

revoke execute on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;
