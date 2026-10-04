# AGENTS.md — OSP Tech

Guidance for AI coding assistants (Claude Code, Cursor, Copilot, etc.) and any contributor working in this repository. Read this before writing code. It is the short, enforceable version of the full docs — follow the linked doc when you need detail.

**Project:** OSP Tech — a public marketing website + OSP Admin dashboard for OSP Technologies (IT, web & design company, Morogoro, Tanzania).
**Full docs:** prd.md · architecture.md · requirements.md · UI-UX.md · database.md · API.md · security.md · implementation.md · workflows.md

---

## 1. What this project is (context)

One **Next.js (App Router, TypeScript)** app serving two surfaces:

- **Public site** — fast, mobile-first, 3D-animated, drives WhatsApp leads. Mostly cached (ISR).
- **OSP Admin** (`/admin`) — login-protected dashboard for content, projects, reminders, finance. Dynamic, private.

Backend is **Supabase** (Postgres + Auth + Storage). No separate API server — use **Server Actions** and **Route Handlers**. Audience is mostly on mid-range Android phones on mobile data, so **performance and WhatsApp-first UX matter more than cleverness**.

---

## 2. Non-negotiable rules

1. **Brand tokens only.** Use the 7 OSP colours and Poppins from the design tokens. **No raw hex** outside `app/globals.css`. (UI-UX.md)
   - `blue #3871FC` · `blue-strong #2457D6` · `teal #04BCC8` · `navy #081B33` · `cloud #F3F6FB` · `slate #5B6576` · `white #FFFFFF`.
   - Small text/links on white → **blue-strong**, not blue. Teal is **accent only** (never large areas or long body on white). Ratio ~60/30/10.
2. **Logo:** use the `<Logo>` component and kit SVGs in `public/brand/`. Never recolour, distort, or hand-build the wordmark. Header switches to the compact mark below 360px.
3. **Validate every input** with Zod, on **both** client and server (`lib/validation`). The server is authoritative.
4. **Auth twice.** Admin server actions check session + `owner` role **and** rely on RLS. Never trust the client. Never expose private data to the `anon` role.
5. **Secrets.** Only `NEXT_PUBLIC_SUPABASE_URL` and the **anon** key may reach the client. The **service-role key is server-only**. Never commit secrets; `.env*` is gitignored.
6. **Money** is `bigint` whole **TZS**. Format in the UI with `lib/format`. Never use floats for money.
7. **Accessibility:** WCAG 2.1 AA. Keyboard paths, focus states, alt text, and honour `prefers-reduced-motion` (swap 3D for the static navy hero).
8. **Performance:** content before 3D; 3D is a dynamic client island with tiered fallback. Keep mobile Lighthouse ≥ 85, LCP < 3s.
9. **Migrations only** for schema changes, with RLS in the same migration. Never edit a shipped migration or change prod schema by hand.
10. **Don't invent brand or scope.** New colours/fonts/features require a doc update first. If a requirement is unclear, ask or check requirements.md — don't guess.

---

## 3. Project layout (where things go)

```
app/
  (public)/      # public site routes (ISR)
  (admin)/       # admin routes (auth-guarded, dynamic)
  api/           # route handlers: cron, export, sitemap, webhooks
  globals.css    # brand tokens live here (ONLY place for raw hex)
components/
  ui/            # branded primitives + <Logo>, <Slash>
  public/        # hero, 3D scene, sections, cards
  admin/         # tables, forms, charts, kanban
lib/
  supabase/      # server/browser/service clients
  db/            # typed queries
  auth/          # session + role guards
  validation/    # Zod schemas (shared)
  whatsapp/      # wa.me link builder
  format/        # TZS + dates (Africa/Dar_es_Salaam)
  analytics/     # recordEvent
supabase/
  migrations/    # timestamped SQL (schema + RLS together)
  seed.sql
public/brand/    # logo SVGs + favicon from the kit
```

Put new code in the matching folder. Shared logic goes in `lib`, not duplicated in components.

---

## 4. Conventions

- **TypeScript strict**; no `any` without a reason. Prefer inferred types from Zod schemas.
- **Server Components by default**; add `"use client"` only for interactivity (3D, charts, forms, drag).
- **Server Actions** return the typed result `{ ok, data } | { ok, error }` (API.md §2) — never throw to the client.
- **Naming:** `camelCase` vars/functions, `PascalCase` components, `snake_case` DB columns, `kebab-case` files/routes.
- **Tailwind** for styling via tokens; avoid inline styles and arbitrary hex values.
- **Revalidate** affected public routes after admin content mutations.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`…). Small, focused PRs. (workflows.md)

---

## 5. Common tasks — the right way

**Add a public content type field** → migration (column + keep RLS) → update Zod schema → update admin form/action → update public render → revalidate.

**Add an admin action** → Zod schema in `lib/validation` → server action with session+role check → typed result → form with loading/empty/error states → RLS policy confirmed.

**Add a WhatsApp button** → use `lib/whatsapp/buildLink` with the item's `whatsapp_message` → call `recordEvent('whatsapp_click')` on click.

**Touch the hero / 3D** → keep it a dynamic `ssr:false` island → verify the light + static fallbacks and reduced-motion → re-check Lighthouse.

**Handle money** → `bigint` TZS end to end → format only at display.

---

## 6. What NOT to do

- ❌ Hard-code content that belongs in the DB/Admin.
- ❌ Introduce a new colour, font, or UI library without a doc change.
- ❌ Put the service-role key, or any secret, in client code or the repo.
- ❌ Skip server-side validation or role checks because "the UI already prevents it".
- ❌ Add a table without RLS, or give the `anon` role access to private data.
- ❌ Render unsanitised HTML; store rich text as Tiptap JSON.
- ❌ Block first paint on 3D or large JS; don't ship Three.js to pages that don't use it.
- ❌ Edit a shipped migration or mutate prod schema/data by hand.
- ❌ Use the colour logo on brand blue or busy photos (use the white variant).

---

## 7. Before you open a PR

Run the project's checks (typecheck, lint, test, build) and walk the **PR checklist in workflows.md §A6**. A change is done only when it's validated, authorised, on-brand, responsive, accessible, and its public routes revalidate.

---

## 8. When unsure

Check the relevant doc (this file links them all). If the docs don't answer it, it's a real open question — surface it rather than guessing. Scope and brand are fixed by the docs; don't expand either silently.
