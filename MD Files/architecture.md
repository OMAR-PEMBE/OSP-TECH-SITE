# Architecture — OSP Tech Website & OSP Admin

| | |
|---|---|
| **Product** | OSP Tech website (public) + OSP Admin (private dashboard) |
| **Owner** | Omar Suleiman Pembe, Founder, OSP Tech |
| **Version** | 1.1 (brand-aligned) |
| **Date** | 4 October 2026 |
| **Companion docs** | prd.md · requirements.md · UI-UX.md · database.md · API.md · security.md · implementation.md · workflows.md · agents.md |

> **v1.1 change:** Added the brand/design-token layer (Section 4a) using the official OSP palette and Poppins; corrected colour references throughout.

---

## 1. Purpose

This document describes **how** the product in `prd.md` is built: the overall system shape, the technology choices and why, how data flows, how the public site and the admin dashboard share one codebase, how 3D stays fast on phones, and how everything is secured and deployed. It is the technical blueprint developers follow.

---

## 2. Architecture at a glance

One Next.js application serves two audiences from the same codebase and the same database:

```
                         ┌─────────────────────────────┐
                         │          Visitors            │
                         │   (phones, mostly 3G/4G)     │
                         └──────────────┬──────────────┘
                                        │ HTTPS
                                        ▼
        ┌───────────────────────────────────────────────────────┐
        │                  Vercel (Edge + CDN)                   │
        │                                                        │
        │   ┌────────────────────────────────────────────────┐  │
        │   │            Next.js application                  │  │
        │   │                                                 │  │
        │   │   PUBLIC ROUTES            ADMIN ROUTES         │  │
        │   │   /, /services,            /admin/*             │  │
        │   │   /products, /blog,        (login-protected)    │  │
        │   │   /portfolio, /contact                          │  │
        │   │                                                 │  │
        │   │   Server Components (SSR/SSG) + Client islands  │  │
        │   │   (3D, charts, forms)                           │  │
        │   │                                                 │  │
        │   │   API routes / Server Actions                   │  │
        │   └───────────────────────┬────────────────────────┘  │
        └───────────────────────────┼───────────────────────────┘
                                     │  (service calls)
                   ┌─────────────────┼──────────────────┐
                   ▼                 ▼                  ▼
          ┌───────────────┐  ┌──────────────┐  ┌──────────────┐
          │   Supabase    │  │   Supabase   │  │   Supabase   │
          │  PostgreSQL   │  │     Auth     │  │   Storage    │
          │ (all data +   │  │ (admin login)│  │ (images,     │
          │  RLS policies)│  │              │  │  receipts)   │
          └───────────────┘  └──────────────┘  └──────────────┘
                   ▲
                   │
          ┌────────┴─────────┐        ┌──────────────────────┐
          │  Resend (email)  │        │  WhatsApp (wa.me)     │
          │ reminders, reset │        │  deep links, Phase 1  │
          └──────────────────┘        └──────────────────────┘
```

Key idea: the **public site reads mostly published, cacheable content**; the **admin writes and reads private business data**. The same database holds both, and **Row-Level Security (RLS)** is the wall between them.

---

## 3. Guiding principles

1. **Mobile-first and fast.** Most visitors are on mid-range Androids on mobile data. Content and text must appear quickly; 3D and heavy visuals load after and degrade gracefully.
2. **One codebase, two surfaces.** Public site and admin live in the same Next.js app to share types, components, and the database client — less to maintain for a solo founder.
3. **Content-driven, not hard-coded.** Services, products, portfolio, posts, and settings come from the database and are edited in Admin.
4. **Brand as code.** The OSP palette and Poppins are expressed once as design tokens and consumed everywhere; nothing is hard-coded off-brand.
5. **Security by default.** Admin is protected at the server layer *and* at the database layer (RLS). The public role can only read published content and insert contact messages.
6. **Progressive enhancement.** The site works with text and images alone; animation and 3D are enhancements, never blockers.
7. **Start simple, leave room to grow.** Phase 1 uses WhatsApp deep links and email; Phase 2 adds the WhatsApp Business API and automation without re-architecting.

---

## 4. Technology stack and rationale

| Layer | Technology | Rationale |
|---|---|---|
| App framework | **Next.js (App Router), React, TypeScript** | Server rendering for SEO and first-load speed; API routes/Server Actions remove the need for a separate backend; one app for site + admin. |
| Styling | **Tailwind CSS** + design tokens | Brand colours and spacing as tokens; small production CSS; fast to build. |
| Fonts | **Poppins** via `next/font/google` | Brand type, self-hosted and subset at build; Arial fallback; no layout shift. |
| UI primitives | **shadcn/ui** (Radix under the hood) | Accessible, unstyled-then-branded components for admin (dialogs, tables, menus). |
| 3D | **Three.js via React Three Fiber** + drei | Declarative 3D that fits React; used for the hero logo and node network. |
| Animation | **GSAP + ScrollTrigger**; **Framer Motion** for component transitions | GSAP for scroll-driven timelines and the "how we work" line draw; Framer Motion for simple enter/exit. |
| Database | **Supabase PostgreSQL** | Relational data (projects, finance, posts) fits SQL; strong querying for reports; RLS for security. |
| Auth | **Supabase Auth** | Email/password login, password reset, sessions; integrates with RLS. |
| File storage | **Supabase Storage** | Receipt photos, portfolio and post images; public and private buckets. |
| Charts | **Recharts** | React-native charts for dashboard and finance. |
| Rich text | **Tiptap** | Blog editor producing clean, structured content. |
| Email | **Resend** | Reminder emails and password resets. |
| Validation | **Zod** | One schema validates forms on the client and inputs on the server. |
| Hosting | **Vercel** (app) + **Supabase** (data) | Global CDN, easy deploys, free/low-cost tiers to start. |
| Analytics | Lightweight events table + optional privacy-friendly analytics | Track page views and WhatsApp clicks without heavy third-party scripts. |

All choices are defaults open to change before Phase 1 begins.

---

## 4a. Brand & design-token layer

The brand (see **UI-UX.md** for the full system) is expressed once and consumed everywhere, so the UI cannot drift off-brand.

**Where tokens live:**
- CSS custom properties on `:root` in `app/globals.css` (the single source), mirrored into `tailwind.config.ts` so Tailwind utility classes map to the same values.
- Poppins loaded once via `next/font/google` and exposed as `--font-poppins`.

```css
/* app/globals.css */
:root {
  --color-blue:        #3871FC;  /* primary */
  --color-blue-strong: #2457D6;  /* small text / links on white */
  --color-teal:        #04BCC8;  /* accent only */
  --color-navy:        #081B33;  /* dark ground, body text, logo bars */
  --color-cloud:       #F3F6FB;  /* light section backgrounds */
  --color-slate:       #5B6576;  /* secondary text */
  --color-white:       #FFFFFF;

  --font-poppins: 'Poppins', Arial, sans-serif;

  --radius: 14px;          /* rounded cards */
  --ratio-note: '60% white/navy · 30% blue · 10% teal';
}
```

```ts
// tailwind.config.ts (excerpt)
theme: {
  extend: {
    colors: {
      blue:        '#3871FC',
      'blue-strong':'#2457D6',
      teal:        '#04BCC8',
      navy:        '#081B33',
      cloud:       '#F3F6FB',
      slate:       '#5B6576',
    },
    fontFamily: { sans: ['var(--font-poppins)', 'Arial', 'sans-serif'] },
    fontWeight: { body: '400', semibold: '600', bold: '700', display: '800' },
  }
}
```

**Logo as assets:** the kit's SVGs (`osp-logo.svg`, `osp-logo-on-dark.svg`, `osp-logo-white.svg`, `osp-logo-navy.svg`, `osp-mark-compact.svg`) and the `favicon/` folder are committed under `public/brand/`. A small `<Logo variant responsive />` component picks the right file by context (header vs footer-on-navy) and swaps to the compact mark below 360px — so the usage rules are enforced in one place.

**Enforcement:** ESLint + a stylelint rule flag raw hex values outside `globals.css`; code review and `agents.md` reinforce "tokens only."

---

## 5. Application structure

### 5.1 Route groups

```
app/
├── (public)/                 # Public website — SEO-rendered
│   ├── page.tsx              # Home
│   ├── services/
│   ├── products/[slug]/
│   ├── portfolio/[slug]/
│   ├── blog/
│   │   └── [slug]/
│   ├── about/
│   ├── contact/
│   └── layout.tsx            # Public nav, footer, floating WhatsApp
│
├── (admin)/                  # OSP Admin — behind auth
│   ├── admin/
│   │   ├── page.tsx          # Dashboard
│   │   ├── projects/
│   │   ├── reminders/
│   │   ├── finance/
│   │   ├── posts/
│   │   ├── services/
│   │   ├── portfolio/
│   │   ├── messages/
│   │   └── settings/
│   └── layout.tsx            # Sidebar shell; requires session
│
├── api/                      # Route handlers (webhooks, exports, cron)
├── globals.css               # Brand tokens live here
└── login/                    # Admin login
```

### 5.2 Rendering strategy per surface

| Surface | Strategy | Reason |
|---|---|---|
| Home, services, products, portfolio, about | **Static or incrementally revalidated (ISR)** | Content changes rarely; serve cached HTML from the CDN for speed and SEO. Revalidate when content is edited in Admin. |
| Blog list & posts | **ISR**, revalidated on publish | Fast, SEO-friendly, auto-updates when a post is published. |
| Contact form submit | **Server Action / API route** | Writes to DB securely, runs spam checks server-side. |
| Admin pages | **Server-rendered, dynamic, no caching** | Always fresh, private, per-session. |
| 3D, charts, editors, drag-and-drop boards | **Client Components ("islands")** | Interactive; hydrated only where needed so the rest stays light. |

### 5.3 Shared layer

```
lib/
├── supabase/        # server client, browser client, admin (service-role) client
├── db/              # typed queries per table
├── auth/            # session helpers, route guards, role checks
├── validation/      # Zod schemas (shared client + server)
├── whatsapp/        # build wa.me links with pre-filled messages
├── format/          # TZS currency, dates (Africa/Dar_es_Salaam)
└── analytics/       # record page_view / whatsapp_click events

components/
├── ui/              # branded shadcn primitives + <Logo>
├── public/          # hero, 3D scene, service cards, sections, 60°-slash
└── admin/           # tables, forms, charts, kanban board
```

---

## 6. Data flow

### 6.1 Visitor views the site (read path)
1. Request hits Vercel CDN. If a cached (ISR) page exists, it is served immediately.
2. On a cache miss or revalidation, the Next.js server reads published content from Supabase using the **public (anon) role**, which RLS restricts to visible/published rows.
3. HTML is sent; 3D and charts hydrate on the client afterward.

### 6.2 Visitor sends a contact message (write path)
1. Form validated on the client with Zod.
2. Submitted via a Server Action; the server re-validates, checks the honeypot field and rate limit, then inserts into `messages`.
3. RLS allows the anon role to **insert** into `messages` only — never to read them.
4. Visitor sees a success state; the message appears in Admin → Messages.

### 6.3 Admin records income/expense (authenticated write)
1. Admin is logged in (Supabase session cookie). The `(admin)` layout rejects unauthenticated requests server-side.
2. Server Action validates input and writes to `income`/`expenses` using the user's session; RLS confirms the user has an Owner role.
3. Receipt image uploads to a **private** Storage bucket; only its path is stored.
4. Dashboard and finance queries recompute summaries on next load.

### 6.4 Admin publishes a blog post
1. Post saved as Draft (DB write).
2. On "Publish", status set to Published and `published_at` set.
3. The server triggers **revalidation** of `/blog` and the post route so the public site shows it without a redeploy.

### 6.5 WhatsApp click (Phase 1)
1. Button builds a `wa.me/<number>?text=<encoded message>` link from `settings.whatsapp_number` + the item's `whatsapp_message`.
2. Click is recorded as a `whatsapp_click` event, then the chat opens.

---

## 7. Authentication & authorisation

- **Login:** Supabase Auth (email + password). Session stored in an HTTP-only cookie.
- **Route protection:** the `(admin)` layout and middleware verify a valid session on the server before rendering any admin route or running any admin Server Action.
- **Roles (v1):** `owner` (full access). `staff` (projects + reminders only, no finance) is defined in the schema for Phase 4 but not yet granted.
- **Database enforcement:** every table has RLS policies. Even if a request reached the database directly, the anon role could not read private tables (finance, projects, reminders, messages, clients) or unpublished content.
- **Secrets:** the Supabase service-role key is used only in trusted server code, never shipped to the browser.

Full policy text and the threat model live in **security.md**; the policy summary is reproduced there and in **database.md**.

---

## 8. Keeping the 3D fast (performance architecture)

This is the main technical risk in the PRD, handled deliberately:

1. **Content first, 3D second.** Text, headline and buttons render server-side and are visible before any 3D loads. The 3D canvas is a client island loaded with `next/dynamic` and `ssr: false`.
2. **Capability & preference checks before loading 3D:**
   - Respect `prefers-reduced-motion` → show a static navy gradient hero instead.
   - Check device memory / connection (`navigator.deviceMemory`, `navigator.connection.effectiveType`); on low-end or slow connections, serve the lightweight fallback.
3. **Tiered hero (all on brand navy):**
   - **Full:** animated 3D logo + interactive node network (blue/teal nodes).
   - **Light:** CSS/SVG animated gradient with a subtle 60° slash motion.
   - **Static:** single optimised image (reduced motion, oldest devices).
4. **Budget the scene:** low polygon counts, capped pixel ratio, paused rendering when the hero scrolls out of view and when the tab is hidden.
5. **Assets:** images in WebP/AVIF, responsive `srcset`, lazy loading below the fold; Poppins subset and preloaded; code-split heavy libraries (Three.js, Tiptap, Recharts).
6. **Targets (from PRD):** mobile Lighthouse performance ≥ 85, LCP < 3 s on 4G.

---

## 9. File & media handling

| Content | Bucket | Access |
|---|---|---|
| Portfolio images, post covers, product mockups | `public-media` | Public read |
| Receipt photos, contracts/project files | `private-media` | Owner only, via signed URLs |

Uploads go through the server (validated type/size), stored in Supabase Storage; the database keeps the file path, not the binary.

---

## 10. Scheduled jobs (reminders & reports)

- A scheduled trigger (Vercel Cron or Supabase scheduled function) runs periodically to:
  - find reminders due soon and send **email** notifications (Resend);
  - generate recurring expense/reminder entries from their repeat rules.
- Phase 2 adds WhatsApp notifications through the WhatsApp Business API from the same job.

---

## 11. WhatsApp integration layers

| Phase | Mechanism | Notes |
|---|---|---|
| **Phase 1 (v1)** | `wa.me` deep links with pre-filled, context-specific messages | No API, no cost, works immediately. Number and messages configured in Admin. |
| **Phase 2** | WhatsApp Business **catalogue** + **Cloud API** | Browse services in WhatsApp; automated replies; outbound reminders/notifications from Admin. Requires a Meta Business account and a server-side integration behind the existing API layer. |

The `lib/whatsapp` module is the single place that builds links in Phase 1 and will host the API client in Phase 2, so pages don't change when the backend upgrades.

---

## 12. SEO architecture

- Server-rendered HTML for all public pages.
- Per-page metadata (title, description, Open Graph image) via Next.js metadata APIs; blog posts supply their own from Admin.
- Default social share image: the primary horizontal logo with tagline on white (per brand rules).
- Auto-generated `sitemap.xml` and `robots.txt`.
- Clean, slug-based URLs for products, portfolio and posts.
- Structured data (JSON-LD) for the organisation and blog articles.

---

## 13. Environments & deployment

| Environment | Purpose |
|---|---|
| **Local** | Development with a separate Supabase project (or local Supabase). |
| **Preview** | Automatic Vercel preview deploy per branch/PR for review. |
| **Production** | `main` branch auto-deploys to Vercel; production Supabase project. |

- Secrets (Supabase keys, Resend key, WhatsApp number) stored as environment variables per environment, never in the repo.
- Database schema managed with **migrations** kept in the repo so changes are versioned and repeatable.

Full git/CI/CD/deploy procedure is in **workflows.md**.

---

## 14. Backups, monitoring & safety

- **Backups:** daily automated Postgres backups (Supabase); periodic export of finance data.
- **Monitoring:** Vercel analytics/logs for errors and performance; Supabase logs for database issues.
- **Error reporting:** a lightweight error tracker (e.g. Sentry) in production.
- **Data protection:** finance and client data are owner-only by RLS; receipts in a private bucket; HTTPS enforced.

---

## 15. How the architecture maps to the release plan

| Phase (PRD) | Architecture work |
|---|---|
| **Phase 0: Design** | Next.js + Tailwind + brand tokens + Poppins set up; `<Logo>` component; hero 3D island + tiered fallback on navy. |
| **Phase 1: Public site** | Public route group, ISR content pages, `messages` table + contact Server Action, WhatsApp link module, SEO, analytics events. |
| **Phase 2: Admin core** | Supabase Auth + RLS, admin layout/guards, CRUD for services/products/portfolio/posts, settings, messages, Storage buckets, revalidation on publish. |
| **Phase 3: Business tools** | Projects (+ kanban), reminders (+ calendar), finance (+ charts, filters, PDF/Excel export), scheduled email reminders. |
| **Phase 4: Growth** | WhatsApp Business API in `lib/whatsapp` + cron, staff role via RLS, invoices, Kiswahili (i18n routing), optional client portal. |

---

## 16. Open technical questions

1. **Internationalisation:** **English-only at launch (decided)** — no i18n routing in v1. Keep content tables shaped so Kiswahili can be added later (per-column `_sw` fields or a translations table) without a painful migration.
2. **Email:** domain is **.com (decided)**; business email provider still to choose (affects the Resend sending domain and DNS/SPF/DKIM records).
3. **Hosting region:** Supabase region closest to Tanzania (EU/South Africa latency trade-off) to minimise latency.
4. **Analytics depth:** in-house events table only, or add a privacy-friendly analytics tool.
5. **Exports:** generate PDF/Excel on the server (consistent, heavier) vs. in the browser (lighter, device-dependent).
