# Workflows — OSP Tech

| | |
|---|---|
| **Product** | OSP Tech website + OSP Admin |
| **Version** | 1.0 |
| **Date** | 4 October 2026 |
| **Companion docs** | implementation.md · architecture.md · security.md · agents.md |

How work gets done on this project: the **development workflow** (git, branches, PRs, CI/CD, deploys, backups) and the **key product workflows** (what happens inside the running app). Written for a solo founder working with AI assistance, so it stays lightweight but disciplined.

---

## Part A — Development workflow

### A1. Git & branches
- **Default branch:** `main` — always deployable. Protected (no direct pushes; PR required).
- **Branch naming:** `feat/<short>`, `fix/<short>`, `chore/<short>`, `docs/<short>`.
- **One change per branch.** Keep PRs small and focused.
- **Commits:** Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`. Present tense, imperative.

### A2. Feature workflow (add something)
1. Pull `main`, branch off: `git switch -c feat/contact-form`.
2. Build it following **implementation.md** (validation, auth/role, RLS, on-brand, states).
3. Run locally: typecheck, lint, test, click through on a narrow viewport.
4. Commit in logical chunks; push.
5. Open a PR → Vercel builds a **preview deploy**.
6. Self-review (or AI review) against the PR checklist (A6); fix.
7. Merge → auto-deploy to production.

### A3. Database change workflow
- Schema changes are **migrations only** — never edit the DB by hand in prod.
- New migration file in `supabase/migrations/` (timestamped): `supabase migration new add_projects`.
- Apply to **dev** first (`supabase db push` against `osp-dev`); verify.
- Include RLS policy changes in the **same** migration as the table.
- Never edit a migration that has shipped — add a new one.
- Apply to **prod** as part of the release (A5). Keep `seed.sql` separate.

### A4. Environments
| Env | App | Database | Purpose |
|---|---|---|---|
| Local | `localhost:3000` | `osp-dev` (or local Supabase) | Build & test |
| Preview | per-PR Vercel URL | `osp-dev` | Review a change |
| Production | the domain | `osp-prod` | Live |

Secrets are set per environment in Vercel + Supabase; never in the repo (security.md §6).

### A5. Release / deploy workflow
1. Merge PR to `main`.
2. If the change needs a migration: apply it to `osp-prod` **before/with** the deploy (so code and schema match).
3. Vercel builds and deploys `main` to production.
4. Smoke-test on the live domain (mobile): home loads, a WhatsApp button opens chat, a test contact submit, admin login.
5. If broken: **roll back** via Vercel's "Promote previous deployment"; revert the PR; add a fix-forward migration if schema is involved (never destructive rollback on prod data without a backup).

### A6. PR checklist (Definition of Done)
- [ ] Typecheck + lint + tests pass.
- [ ] Zod validation on client **and** server for any new input.
- [ ] Server-side session/role check on any admin action.
- [ ] RLS policy exists for any new table/column.
- [ ] On brand: only tokens + Poppins; correct logo variant; no raw hex outside `globals.css`; ≤1 slash per layout.
- [ ] Responsive 360px→desktop; keyboard + reduced-motion OK; AA contrast.
- [ ] Loading / empty / error states handled.
- [ ] Public routes revalidated if content shape changed.
- [ ] Secrets only in env; nothing sensitive logged.

### A7. CI (GitHub Actions)
On every PR: install → typecheck → lint → test → build. Optional: secret scanner, Lighthouse CI budget on key pages. Block merge on failure.

### A8. Backups & recovery
- Supabase **daily backups** (confirm retention).
- Monthly manual **finance CSV export** kept off-platform.
- Document and occasionally rehearse a **restore drill** (restore to a scratch Supabase project, re-point env).

### A9. Dependencies & housekeeping
- Update dependencies monthly; review breaking changes on preview first.
- Keep `.env.example` current (names only, no values).
- Remove dead code and unused assets; keep the brand folder tidy.

---

## Part B — Key product workflows (inside the app)

These are the real flows the software supports; each maps to requirements in requirements.md and endpoints in API.md.

### B1. Visitor → WhatsApp lead
Visitor lands on hero → reads the offer → taps a context WhatsApp button (service/product or FAB) → `recordEvent('whatsapp_click')` → `wa.me` opens with the pre-filled message → conversation starts in the owner's WhatsApp.

### B2. Visitor → contact message
Fills name/phone/need/message → client Zod validation → `submitContactMessage` (honeypot + rate limit + server Zod) → `messages` row + `contact_submit` event → success state → owner sees it in **Admin → Messages**, replies via the one-tap WhatsApp link, or converts it into a project/reminder.

### B3. Owner publishes content
Admin → Services/Products/Portfolio/Posts → create/edit (Zod-validated) → save → server action writes + `revalidatePath` → public site reflects the change within the revalidation window. Posts have an explicit **Publish** step that sets `published_at` and reveals them publicly.

### B4. Owner records money
Admin → Finance → add income (client/project, method, reference) or expense (category, method, receipt photo → private bucket) → dashboard totals and charts update → filter/report by date/category/project → export PDF/CSV for records.

### B5. Owner tracks a project
Admin → Projects → create (client, type, price, deadline) → work the **kanban** (drag Planning→In Progress→Testing→Completed) → tick task checklist (drives progress %) → linked income shows **paid vs price** → overdue projects flagged on the board and dashboard.

### B6. Reminders & notifications
Owner adds a reminder (optionally linked to a project/client, optionally repeating) → appears in Today/Week/Later/Overdue + calendar → `/api/cron/reminders` (scheduled) emails due reminders and generates recurring entries → Phase 2 adds WhatsApp notifications.

### B7. Business automation (service delivery note)
"Business Automation" is also a **service OSP sells**. The same patterns here (scheduled jobs, reminders, WhatsApp links, report exports) are the toolkit used to build automation for clients — the site/admin is the first reference implementation.

---

## Part C — Content & brand governance

- **Brand source of truth:** UI-UX.md. Any visual change is checked against it.
- **Content tone:** short, benefit-first, direct "you"; EN or SW, never mixed in one headline (UI-UX.md §11).
- **New colours/fonts:** not allowed without updating UI-UX.md first (and they shouldn't be needed).
- **Logo:** only kit variants; follow usage rules; never recolour or distort.
- **Posting cadence target:** ≥ 2 blog posts/month (prd.md success metrics).
