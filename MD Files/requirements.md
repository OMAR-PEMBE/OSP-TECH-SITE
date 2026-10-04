# Requirements Register — OSP Tech

| | |
|---|---|
| **Product** | OSP Tech website + OSP Admin |
| **Version** | 1.0 |
| **Date** | 4 October 2026 |
| **Companion docs** | prd.md (the "why") · this doc (the "what", testable) |

The PRD describes intent; this register lists **testable requirements** with IDs, priorities and acceptance criteria, so build and QA can tick each one. Priorities use **MoSCoW**: Must, Should, Could, Won't-yet.

**Legend:** Pri = priority · Phase = target release phase (see prd.md §10).

---

## 1. Functional — Public website

| ID | Requirement | Acceptance criteria | Pri | Phase |
|---|---|---|---|---|
| FR-W1 | Content-driven pages | Services/products/portfolio/posts render from DB; editing in Admin changes the site without a deploy | Must | 1–2 |
| FR-W2 | Hero (navy, 3D) | Hero shows on brand navy; headline = tagline in display italic; 3D logo + node network on capable devices | Must | 1 |
| FR-W3 | WhatsApp buttons | Every service & product has a button opening `wa.me` with its own pre-filled message | Must | 1 |
| FR-W4 | Floating WhatsApp FAB | Present on all pages; pulses once after load; opens chat with default greeting | Must | 1 |
| FR-W5 | Contact form | Valid submit stores a `messages` row and shows success; appears in Admin → Messages | Must | 1 |
| FR-W6 | Contact spam protection | Honeypot + rate limit block scripted spam; real submits pass | Must | 1 |
| FR-W7 | Blog | Only `published` posts show; list paginates; post page renders Tiptap content | Must | 1–2 |
| FR-W8 | Services/Products/Portfolio detail pages | Each item has a slug page with its full content and WhatsApp CTA | Must | 1 |
| FR-W9 | About + Contact + 404 | Branded pages exist and link correctly | Must | 1 |
| FR-W10 | SEO metadata | Each page has title, meta description, OG image; sitemap & robots generated | Must | 1 |
| FR-W11 | Analytics events | Page views and WhatsApp clicks recorded in `events` | Should | 1 |
| FR-W12 | Kiswahili toggle | Not in v1 — site is English-only at launch; revisit post-launch | Won't-yet | 4 |

## 2. Functional — OSP Admin

| ID | Requirement | Acceptance criteria | Pri | Phase |
|---|---|---|---|---|
| FR-A1 | Login | Owner logs in with email/password; wrong creds rejected generically; session persists | Must | 2 |
| FR-A2 | Route protection | Unauthenticated access to `/admin/*` redirects to login; no admin data leaks | Must | 2 |
| FR-A3 | Dashboard | Shows income/expenses/profit this month, active projects, upcoming reminders, new-message count | Must | 2–3 |
| FR-A4 | Services/Products CRUD | Create/edit/delete/reorder/show-hide; WhatsApp message editable; reflects on site | Must | 2 |
| FR-A5 | Portfolio CRUD | Create/edit/delete/reorder/show-hide with images | Must | 2 |
| FR-A6 | Posts CRUD + publish | Draft/publish/unpublish; publish revalidates public blog | Must | 2 |
| FR-A7 | Messages | List, change status, reply-on-WhatsApp link, convert to project/reminder | Must | 2 |
| FR-A8 | Settings | Edit company details, WhatsApp number, socials, trust stats; change password | Must | 2 |
| FR-A9 | Projects | CRUD; kanban board + list; drag status; task checklist; progress %; paid vs price; overdue flag | Must | 3 |
| FR-A10 | Reminders | CRUD; today/week/later/overdue + calendar; mark done; repeat rules | Must | 3 |
| FR-A11 | Reminder email notifications | Due reminders trigger an email to the owner | Should | 3 |
| FR-A12 | Finance income | Record/edit/delete with method, reference, client/project link | Must | 3 |
| FR-A13 | Finance expenses | Record/edit/delete with category, method, receipt upload | Must | 3 |
| FR-A14 | Finance reports | Monthly totals, income-vs-expense chart, by-category chart, date/category/project filters | Must | 3 |
| FR-A15 | Finance export | Download PDF and CSV for a date range | Should | 3 |
| FR-A16 | Recurring finance/reminders | Monthly recurring expenses/reminders auto-generate | Should | 3 |
| FR-A17 | WiFi revenue-share category | Income can be tagged and reported as WiFi revenue share | Should | 3 |
| FR-A18 | Invoices/receipts | Generate a branded receipt from an income record | Could | 4 |
| FR-A19 | Staff role | Staff user sees projects/reminders only, not finance | Won't-yet | 4 |

## 3. Brand & design requirements

| ID | Requirement | Acceptance criteria | Pri |
|---|---|---|---|
| FR-B1 | Palette only | Only the 7 brand tokens (+ muted functional state colours) appear; no stray hex outside `globals.css` | Must |
| FR-B2 | 60/30/10 ratio | Screens hold ~60% white/navy, 30% blue, 10% teal; teal never large-area or long body on white | Must |
| FR-B3 | Accessible text colour | Small text/links on white use Blue-Strong #2457D6; blue only for 24px+ headings | Must |
| FR-B4 | Typography | Poppins everywhere; display = ExtraBold Italic; body = Regular; labels = SemiBold caps | Must |
| FR-B5 | Logo usage | Correct variant per background; header switches to compact mark <360px; clear space & min size respected; no distortion/recolour | Must |
| FR-B6 | 60° slash | At most one slash per layout; sourced from token colours | Should |
| FR-B7 | Favicon/PWA | Favicon set from kit; theme `#3871FC`, background `#FFFFFF` | Must |

## 4. Non-functional requirements

| ID | Area | Requirement / target | Pri |
|---|---|---|---|
| NFR-1 | Performance | Mobile Lighthouse ≥ 85; LCP < 3s on 4G; content visible before 3D | Must |
| NFR-2 | 3D degradation | Tiered hero (full/light/static) by device, connection, reduced-motion | Must |
| NFR-3 | Responsive | No horizontal scroll 360px→desktop; mobile-first | Must |
| NFR-4 | Accessibility | WCAG 2.1 AA: contrast, keyboard nav, alt text, reduced motion, focus states | Must |
| NFR-5 | Security | Two-layer auth (server + RLS); HTTPS/HSTS; validated inputs; rate limits; secrets in env (see security.md) | Must |
| NFR-6 | Data safety | Daily backups; finance never public; private receipts bucket | Must |
| NFR-7 | SEO | SSR/ISR, clean URLs, metadata, OG, sitemap, JSON-LD | Must |
| NFR-8 | Maintainability | Content via Admin; typed code; migrations versioned; tokens centralised | Must |
| NFR-9 | Images | WebP/AVIF, responsive sizes, lazy load | Should |
| NFR-10 | Localisation-ready | Data model allows adding Kiswahili later without migration pain | Should |
| NFR-11 | Browser support | Current Chrome/Firefox/Safari/Edge + Android WebView; graceful on older | Should |
| NFR-12 | Uptime | Rely on Vercel/Supabase SLAs; `/api/health` for checks | Should |

## 5. Technical / environment requirements

| ID | Requirement | Pri |
|---|---|---|
| TR-1 | Next.js (App Router) + TypeScript; one app for site + admin | Must |
| TR-2 | Tailwind with brand tokens; Poppins via `next/font` | Must |
| TR-3 | Supabase project (Postgres + Auth + Storage), region nearest Tanzania | Must |
| TR-4 | Three.js/R3F for 3D; GSAP/Framer Motion for animation | Must |
| TR-5 | Zod validation shared client/server | Must |
| TR-6 | Resend (or equivalent) for email | Should |
| TR-7 | Vercel hosting; preview deploys per PR; prod on `main` | Must |
| TR-8 | Env vars per environment; service-role key server-only | Must |
| TR-9 | Migrations in `supabase/migrations`; seed script | Must |
| TR-10 | Error tracking (Sentry) + logging in production | Should |

## 6. Data requirements
Full schema in **database.md**. Summary: 15 tables (`profiles`, `settings`, `services`, `products`, `portfolio_items`, `posts`, `clients`, `projects`, `project_tasks`, `reminders`, `income`, `expenses`, `expense_categories`, `messages`, `events`); money as whole-TZS `bigint`; two storage buckets (`public-media`, `private-media`).

## 7. Constraints, assumptions & decisions
- **Decided:** domain is **.com**; site is **English-only** at launch; official WhatsApp number **+255747809299** (`wa.me` form `255747809299`).
- Solo founder, self-financed → prefer free/low-cost tiers; phased delivery.
- Audience mostly on phones/mobile data → performance and WhatsApp-first.
- Payments happen off-site (mobile money/bank) → no payment gateway in v1.
- No public sign-up; single owner account to start.

## 8. Out of scope (v1–v3)
Online payments, client login portal, multi-currency, full double-entry accounting, WhatsApp Business API automation, public partner API. (Several move into Phase 4 — see prd.md.)

## 9. Traceability
Each FR/NFR maps to: a PRD section (intent), an implementation.md step (build), and a test. QA signs off a requirement only when its acceptance criteria pass on mobile and desktop.
