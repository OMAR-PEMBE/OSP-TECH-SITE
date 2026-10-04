# Security — OSP Tech

| | |
|---|---|
| **Product** | OSP Tech website + OSP Admin |
| **Version** | 1.0 |
| **Date** | 4 October 2026 |
| **Companion docs** | architecture.md · database.md · API.md |

Security model for a solo-founder product that holds **private business finances and client data**. The guiding rule: the public can only ever read published marketing content and submit a contact message; everything else requires an authenticated owner, enforced at **two layers** (server code and database RLS).

---

## 1. Assets to protect

| Asset | Sensitivity | Where |
|---|---|---|
| Finance records (income, expenses, receipts) | High | `income`, `expenses`, `private-media` |
| Client details (names, phones) | High | `clients`, `messages` |
| Projects & internal notes | Medium | `projects`, `project_tasks`, `reminders` |
| Admin credentials & sessions | High | Supabase Auth |
| Published content | Low (public by design) | services/products/posts/portfolio |
| Secrets (API keys) | High | Env vars |

---

## 2. Authentication

- **Supabase Auth**, email + password, for the owner.
- Passwords hashed by Supabase (bcrypt/scrypt); the app never sees plaintext at rest.
- Sessions in **HTTP-only, Secure, SameSite=Lax** cookies; refresh handled by Supabase SSR helpers.
- **Session timeout:** idle timeout + absolute expiry; re-auth on expiry.
- **Password reset:** email link via Supabase (Resend as sender). Reset tokens are single-use and short-lived.
- **Strong password policy** on sign-up/reset (length ≥ 12, not breached — optional HIBP check).
- **MFA (recommended for Phase 2):** enable Supabase TOTP for the owner account.
- **No public sign-up.** The owner account is provisioned manually/seeded; there is no open registration route.

---

## 3. Authorisation — two layers

### Layer 1 — Server (app)
- Middleware + the `(admin)` layout verify a valid session before any admin route renders.
- Every admin Server Action re-checks the session and calls `is_owner()` before touching data (never trust the client).
- Role checks: `owner` (full), `staff` (Phase 4: projects/reminders only, no finance).

### Layer 2 — Database (RLS)
RLS is enabled on **every** table; the app connects as the user's role, not as a superuser, for user-facing operations. Even a bug in app code cannot leak private rows, because the database refuses them.

```sql
-- helper
create function is_owner() returns boolean language sql stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'owner');
$$;

-- public content: read only when visible/published
create policy services_public_read on services for select
  to anon using (visible = true);
create policy posts_public_read on posts for select
  to anon using (status = 'published');

-- owner full control
create policy services_owner_all on services for all
  to authenticated using (is_owner()) with check (is_owner());

-- contact form: anon may INSERT, never SELECT
create policy messages_anon_insert on messages for insert
  to anon with check (true);
create policy messages_owner_all on messages for all
  to authenticated using (is_owner()) with check (is_owner());

-- analytics: anon INSERT only; owner reads
create policy events_anon_insert on events for insert
  to anon with check (true);
create policy events_owner_read on events for select
  to authenticated using (is_owner());

-- private business data: no anon policy at all (deny by default)
create policy finance_owner_all on income for all
  to authenticated using (is_owner()) with check (is_owner());
-- repeat for expenses, expense_categories, clients, projects, project_tasks, reminders
```

**Default deny:** tables with RLS on and no matching policy return nothing. Private tables have **no `anon` policy**, so the public role sees zero rows.

The `settings` table is not read by anon directly; a `public_settings` **view** exposes only non-sensitive fields, and the view is what the site reads.

---

## 4. Input validation & sanitisation

- **Zod** parses every input (client + server). Server is authoritative — it re-validates even if the client passed.
- Parameterised queries only (Supabase client / SQL) — no string-built SQL → no SQL injection.
- **Rich text (Tiptap):** store structured JSON, not raw HTML. On render, only whitelisted node types/marks are output → no stored XSS. If HTML is ever rendered, sanitise with a strict allowlist.
- **File uploads:** validate MIME and size server-side; store with generated names; never execute uploaded files; serve private files via short-lived signed URLs.
- Escape/encode all user content on output (React does this by default; be careful with any `dangerouslySetInnerHTML`).

---

## 5. Abuse & rate limiting

| Vector | Control |
|---|---|
| Contact-form spam | Honeypot field + rate limit (5/10min/IP) + min-time-to-submit check |
| Login brute force | Rate limit + backoff; generic error ("invalid credentials") |
| Analytics flooding | Per-IP cap; silent drop over limit |
| Report export abuse | Per-user hourly cap |
| Cron endpoint | Secret header / Vercel signed invocation |

See API.md §6 for concrete numbers.

---

## 6. Secrets management

- All secrets in **environment variables** per environment (local/preview/prod); never in the repo.
- Client-exposed vars are prefixed `NEXT_PUBLIC_` and contain **only** the Supabase URL and **anon** key (safe by design, bounded by RLS).
- The **service-role key** is server-only, used solely in trusted server code (cron, admin operations that must bypass RLS) — never in a client bundle, never in `NEXT_PUBLIC_*`.
- Rotate keys if leaked; `.env*` in `.gitignore`; use a secret scanner in CI.

---

## 7. Transport & headers

- **HTTPS everywhere** (Vercel default; HSTS enabled).
- Security headers via `next.config` / middleware:
  - `Content-Security-Policy` — restrict script/style/img/connect to self + Supabase + fonts; allow the 3D/analytics origins explicitly.
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY` (admin not embeddable)
  - `Permissions-Policy` — disable camera/mic/geo unless needed.
- **CSRF:** Server Actions are origin-checked by Next.js; cookies are SameSite=Lax. For route handlers that mutate, verify origin / use the session.

---

## 8. Storage security

| Bucket | Policy |
|---|---|
| `public-media` | Public read; writes only by owner via server. No listing of arbitrary paths. |
| `private-media` | No public access. Read only via short-lived signed URLs issued to the owner. Receipts/contracts live here. |

Never place a receipt or contract in `public-media`. The DB stores paths; access is mediated by signed URLs.

---

## 9. Data protection & privacy

- Collect the minimum: contact form takes name, phone, need, message — nothing more.
- Finance and client data are owner-only (RLS + private bucket).
- Add a short **privacy note** on the contact form (what data is collected, that it's used only to respond).
- Retention: keep a plan to purge old analytics `events` (e.g. 12 months) and closed messages on request.
- Tanzania context: follow local data-protection expectations; avoid storing card/bank numbers (store only a reference string for payments).

---

## 10. Backups & recovery

- **Daily automated Postgres backups** (Supabase). Confirm the retention window on the chosen plan.
- **Periodic finance export** (CSV) kept off-platform as a secondary copy.
- Document a **restore drill**: how to restore a backup to a fresh Supabase project and re-point env vars.
- Storage buckets: enable versioning or periodic export for `private-media`.

---

## 11. Monitoring & incident response

- **Error tracking** (Sentry) in production; alert on spikes.
- **Logs:** Vercel (app) + Supabase (DB/auth) — review auth failures and unusual query patterns.
- **Incident steps:** (1) rotate affected secrets, (2) invalidate sessions, (3) assess data exposure via logs, (4) restore from backup if integrity is in doubt, (5) note what happened and the fix.

---

## 12. Threat model (STRIDE-lite)

| Threat | Example | Mitigation |
|---|---|---|
| **Spoofing** | Someone hits admin actions unauthenticated | Server session check + RLS deny-by-default |
| **Tampering** | Forged form fields, slug collisions | Zod validation, DB constraints, `CONFLICT` handling |
| **Repudiation** | "I didn't change that" | `created_at/updated_at`, logs, (Phase 4) `created_by` audit |
| **Information disclosure** | Public reads finance | RLS private tables have no anon policy; private bucket |
| **Denial of service** | Form/login flooding | Rate limits, honeypot, CDN |
| **Elevation of privilege** | Staff reads finance (Phase 4) | Role-scoped RLS; finance tables exclude `staff` |

---

## 13. Pre-launch security checklist

- [ ] RLS enabled on every table; private tables have no anon policy.
- [ ] `public_settings` view exposes only safe fields.
- [ ] Service-role key server-only; client bundle has only anon key.
- [ ] Rich text stored as JSON; no unsanitised HTML rendered.
- [ ] Rate limits live on contact, login, events, export.
- [ ] Honeypot + min-submit-time on contact form.
- [ ] Security headers + CSP set and tested.
- [ ] Private bucket not publicly readable; signed URLs short-lived.
- [ ] Backups confirmed running; restore drill documented.
- [ ] Secrets in env only; `.env*` gitignored; secret scanner in CI.
- [ ] HTTPS/HSTS on; no mixed content.
- [ ] Error messages generic to the client; details in Sentry.
