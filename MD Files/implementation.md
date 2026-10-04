# Implementation Plan — OSP Tech

| | |
|---|---|
| **Product** | OSP Tech website + OSP Admin |
| **Version** | 1.0 |
| **Date** | 4 October 2026 |
| **Companion docs** | prd.md · architecture.md · requirements.md · UI-UX.md · database.md · API.md · security.md · workflows.md |

A step-by-step build guide, phase by phase, with a Definition of Done for each. Built by a solo founder (with AI assistance — see agents.md), so steps are ordered to ship something useful early and keep momentum.

---

## 0. Prerequisites (one-time)

- [ ] Node.js LTS, pnpm (or npm), Git, VS Code.
- [ ] GitHub repo created (`osp-tech-web`), `main` protected.
- [ ] Vercel account linked to the repo.
- [ ] Supabase account; create **two** projects: `osp-dev` and `osp-prod` (region nearest Tanzania).
- [ ] Resend account (email) — can defer to Phase 3.
- [ ] Brand kit committed to `public/brand/` (logo SVGs + favicon folder).
- [x] Blocking questions decided: **English-only**, **.com** domain, WhatsApp **+255747809299** (`wa.me` form `255747809299`). Register the .com domain and set it on Vercel; seed the number into `settings`.

---

## Phase 0 — Foundation & design system (the look)

**Goal:** prove the brand and the hero before building features.

1. **Scaffold:** `create-next-app` (App Router, TypeScript, Tailwind, ESLint). Set up pnpm, Prettier, absolute imports.
2. **Brand tokens:** add the 7 colours + radius to `app/globals.css` `:root`; mirror into `tailwind.config.ts`. Load **Poppins** via `next/font/google` (weights 400/600/700/800, italic). (UI-UX.md §2–3, architecture.md §4a.)
3. **`<Logo>` component:** picks variant by context, swaps to compact mark <360px. Commit kit assets.
4. **`<Slash>` component:** SVG 60° bars in blue/teal from tokens.
5. **Primitives:** buttons, container, section, typography styles; wire shadcn/ui.
6. **Hero prototype (navy):**
   - Static navy hero with display-italic tagline headline + buttons first.
   - Add the 3D island (`next/dynamic`, `ssr:false`): rotating OSP logo + node network (blue/teal nodes).
   - Add tiered fallback: full / light (CSS gradient + slash motion) / static, chosen by `prefers-reduced-motion` + `deviceMemory`/connection.
7. **Deploy to Vercel** (preview). Check on a real mid-range Android.

**Definition of Done:** hero renders on brand navy, on brand, with 3D on capable devices and graceful fallback elsewhere; Lighthouse mobile ≥ 85 on the hero page; no stray hex outside `globals.css`.

---

## Phase 1 — Public website (get leads)

**Goal:** the full marketing site, live, driving WhatsApp chats. Content can be seeded directly in the DB for now.

1. **Supabase wiring:** install clients (server/browser); add env vars; create `lib/supabase/*`.
2. **Schema (subset):** migrations for `settings`, `services`, `products`, `portfolio_items`, `posts`, `messages`, `events` + enums; `public_settings` view; seed data (database.md §7). Enable RLS + public-read/insert policies now (security.md §3).
3. **Shared libs:** `lib/validation` (contact schema), `lib/whatsapp` (link builder), `lib/format` (TZS, dates), `lib/analytics` (recordEvent).
4. **Global layout:** nav bar (transparent→frosted on scroll), footer (navy, on-dark logo), floating WhatsApp FAB.
5. **Home sections** (UI-UX + prd.md §5.2): hero → trust strip (count-up) → services → products → how-we-work (line draw) → portfolio → latest posts → CTA band (navy) → contact.
6. **Detail pages:** `/services`, `/products/[slug]`, `/portfolio/[slug]`, `/about`, `/contact`, `/404`. ISR for content pages.
7. **Blog:** `/blog` (published only, paginated) + `/blog/[slug]` (Tiptap JSON render).
8. **Contact form:** `submitContactMessage` server action + honeypot + rate limit; success/empty/error states.
9. **WhatsApp buttons:** context messages on every service/product; FAB; click events.
10. **SEO:** per-page metadata, OG image (logo on white), `sitemap.xml`, `robots.txt`, JSON-LD org.
11. **Perf pass:** image optimisation (WebP/AVIF, `next/image`), code-split 3D, preload Poppins subset.
12. **Accessibility pass:** keyboard, focus, contrast (Blue-Strong for small text), reduced motion.

**Definition of Done:** all FR-W Musts pass on mobile + desktop; a real WhatsApp chat opens with the right message; a test contact submit lands in the DB; Lighthouse mobile ≥ 85; AA contrast verified. Launch on the domain.

---

## Phase 2 — Admin core (manage content without code)

**Goal:** owner edits all site content and handles messages from a dashboard.

1. **Auth:** Supabase Auth; provision the owner account; `profiles` table + `handle_new_user` trigger; login page; middleware + `(admin)` layout guard. No public sign-up.
2. **Admin shell:** sidebar + responsive collapse; branded, calm (Cloud/white, no 3D).
3. **Storage:** create `public-media` + `private-media` buckets; `uploadMedia` action with MIME/size checks.
4. **CRUD (server actions + forms, Zod-validated):** Services, Products, Portfolio — create/edit/delete/reorder/toggle; revalidate public routes on change.
5. **Posts:** Tiptap editor; draft/publish/unpublish; publish revalidates blog.
6. **Messages:** list, status, reply-on-WhatsApp, convert to project/reminder (stub convert until Phase 3 tables exist).
7. **Settings:** company details, WhatsApp number, socials, trust stats; change password.
8. **Dashboard (partial):** new-message count + content shortcuts (finance/projects widgets come in Phase 3).

**Definition of Done:** FR-A1–A8 pass; editing content in Admin updates the live site within the revalidation window; RLS verified (anon cannot read private tables); uploads land in the right bucket.

---

## Phase 3 — Business tools (run the business)

**Goal:** projects, reminders, finance — the founder's operating system.

1. **Schema:** migrations for `clients`, `projects`, `project_tasks`, `reminders`, `income`, `expenses`, `expense_categories`; owner-only RLS; seed expense categories.
2. **Clients:** CRUD + search; used by projects/income.
3. **Projects:** list + **kanban** (drag to change status); task checklist with progress %; amount paid vs price (computed from income); overdue highlighting; notes.
4. **Reminders:** CRUD; Today/Week/Later/Overdue + calendar; mark done; repeat rules.
5. **Finance:** income + expenses CRUD; receipt upload (private bucket); categories editable; TZS formatting; filters (date/category/project/method).
6. **Finance reports:** monthly totals, income-vs-expense chart, by-category chart (Recharts, labelled series); PDF + CSV export (`/api/finance/export`).
7. **Dashboard (full):** income/expenses/profit cards, 6-month chart, active projects, upcoming/overdue reminders.
8. **Scheduled jobs:** `/api/cron/reminders` (Vercel Cron) — email due reminders (Resend), generate recurring entries; cron secret.

**Definition of Done:** FR-A9–A17 pass; a month of income/expenses produces correct totals and charts; export opens in Excel and as PDF; a due reminder sends an email.

---

## Phase 4 — Growth (automation & scale)

Pick as needed, not all at once:
- **WhatsApp Business API** in `lib/whatsapp` + `/api/webhooks/whatsapp`; catalogue; outbound reminders/notifications.
- **Staff role** via RLS (projects/reminders only).
- **Invoices/receipts** (branded) from income records.
- **Kiswahili** (i18n routing + translated content fields).
- **Client portal** (clients view their project progress) — only if demand appears.
- **MFA** on the owner account.

**Definition of Done:** each feature ships behind its own PR with its acceptance criteria; no regression to Phase 1–3 Musts.

---

## Cross-cutting checklists

**Every feature:** Zod validation (client+server) · server-side auth/role check · RLS policy exists · on-brand (tokens/Poppins/logo) · mobile + keyboard tested · loading/empty/error states · revalidate affected public routes.

**Before each deploy:** typecheck + lint pass · no raw hex outside `globals.css` · env vars set for the target · migration applied to that env's DB · preview reviewed on a phone.

**Suggested order of first 2 weeks:** Phase 0 (hero) → Phase 1 home + contact + WhatsApp → rest of Phase 1 pages → launch → then Phase 2.

---

## Milestones (indicative, solo pace)

| Milestone | Deliverable |
|---|---|
| M0 | Hero + design system approved (Phase 0) |
| M1 | Public site live on domain (Phase 1) |
| M2 | Admin content + messages (Phase 2) |
| M3 | Finance + projects + reminders (Phase 3) |
| M4 | First growth feature (Phase 4) |

Dates are intentionally omitted — set them against your own availability.
