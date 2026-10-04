# Product Requirements Document — OSP Tech Website & OSP Admin

| | |
|---|---|
| **Product** | OSP Tech website (public) + OSP Admin (private dashboard) |
| **Owner** | Omar Suleiman Pembe, Founder, OSP Tech |
| **Version** | 1.1 (brand-aligned) |
| **Date** | 4 October 2026 |
| **Status** | Draft for review |
| **Companion docs** | architecture.md · requirements.md · UI-UX.md · database.md · API.md · security.md · implementation.md · workflows.md · agents.md |

> **v1.1 change:** Section 4 (Brand) rewritten to match the official **OSP Tech Brand Guidelines** and logo pack (exact colours, Poppins typography, 60/30/10 colour ratio, white **or** navy grounds). The earlier "light only, avoid darkness" wording was incorrect.

---

## 1. Overview

OSP Tech is the brand of **OSP Technologies**, an IT, web and design company based in Morogoro, Tanzania. Tagline: **"Turning Ideas Into Digital Solutions."**

This project delivers two connected products:

1. **Public website**: a modern, eye-catching, 3D-animated marketing site that presents OSP Tech's services, ready-made systems, portfolio and blog, and drives customers to chat on WhatsApp.
2. **OSP Admin**: a private, login-protected dashboard for running the business: projects, reminders, finances (income and expenses), blog posts, and the content shown on the public site.

Both are built from scratch (no purchased template) so the design matches the OSP brand exactly, stays fast on mobile data, and itself serves as a portfolio piece.

---

## 2. Goals

### Business goals
- Give OSP Tech a professional online presence that looks like a real tech company.
- Convert visitors into WhatsApp conversations and leads.
- Support the goal of **~10 clients by end of 2026** (system rentals or custom builds).
- Showcase past work (BORNTZ, MFBMS) and ready-made products (OSP WiFi Billing System).
- Give the founder one place to track money, projects and deadlines.

### User goals
- **Visitors / potential clients:** quickly understand what OSP Tech does, see proof of past work, and contact the company in one tap.
- **Founder (admin):** know at a glance how much money came in and went out, what projects are active, and what is due next.

### Non-goals (v1)
- Online payments on the website (clients pay via mobile money/bank outside the site).
- Client login portal.
- Multi-company or multi-currency accounting.
- Full double-entry accounting (v1 is simple income/expense tracking).
- WhatsApp Business API automation (planned for Phase 2).

---

## 3. Target users

| User | Description | Needs |
|---|---|---|
| Small business owners (shops, stationeries, hostels, landlords) | Mostly on phones, often on mobile data | Clear services, simple language, fast loading, easy WhatsApp contact |
| Organisations / larger clients | Desktop and mobile | Credibility, portfolio, professional look |
| Founder / admin (Omar) | Desktop and mobile | Fast record-keeping, overview of finances and projects, easy content updates |
| Future team members | Added later | Restricted access by role |

---

## 4. Brand & design direction

**Source of truth:** OSP Tech Brand Guidelines + logo pack. Full implementation detail lives in **UI-UX.md**; this section is the summary the rest of the PRD builds on.

### Personality
- **Confident and forward-moving** — the italic wordmark and the 60° slash lean forward; layouts feel energetic but uncluttered.
- **Professional, not corporate** — clean **white or deep navy** grounds, generous space, one strong headline.
- **Local and practical** — plain, friendly language; English **or** Kiswahili, never both in one headline.

### Colour (exact)

| Token | HEX | Role |
|---|---|---|
| Brand Blue | **#3871FC** | Logo, wordmark, big headlines, blocks, primary buttons |
| Blue Strong | **#2457D6** | Small links and button text on white (accessible for small text) |
| Brand Teal | **#04BCC8** | **Accent only** — one keyword, a line, the slash graphic; never large areas |
| Brand Navy | **#081B33** | Dark backgrounds, logo bars, body text |
| Cloud | **#F3F6FB** | Light section backgrounds |
| Slate | **#5B6576** | Secondary text |
| White | **#FFFFFF** | Primary light ground; PWA background |

**Colour ratio: ~60% white or navy ground, 30% brand blue, 10% teal.** Teal is the accent — use it for one key word, a line, or the slash, never for large areas or long body text on white.

**Accessibility note:** brand blue on white is 4.25:1 — fine for headings 24px and up, but use **Blue Strong (#2457D6)** for small text and links on white. Teal on white is decorative only; teal on navy is excellent (7.4:1).

### Typography
**One family: Poppins** (Google Fonts; Arial fallback).
- **Display:** Poppins ExtraBold Italic (800) — matches the wordmark; hero and section headlines, short phrases.
- **Headings:** Poppins Bold / SemiBold, upright.
- **Body:** Poppins Regular, 16px web.
- **Labels:** Poppins SemiBold, UPPERCASE, slightly letter-spaced (e.g. FOUNDER).

### Signature graphic — the 60° slash
Two or three parallelogram bars cut at 60°, in blue and teal, usually bleeding off a bottom or right edge. **One per layout** (a corner of a section, the end of a footer band, the edge of a card). Never a busy repeating pattern. On navy layouts, a very faint oversized navy icon may sit behind content for depth.

### Logo usage (web)
- **Header / nav:** horizontal, no tagline (SVG), 32–44px tall. Under 360px wide, switch to the **compact icon**.
- **Hero:** no logo needed (it's already in the header); the **tagline becomes the headline** in display type.
- **Footer:** primary horizontal with tagline, or stacked — **on-dark** version on navy.
- **Favicon:** compact icon (from the kit's favicon folder).
- **Link preview (WhatsApp/social share):** primary horizontal with tagline on white.
- **Don'ts:** don't stretch, recolour, rotate, add shadows/glows/outlines, rebuild the wordmark in another font, put the colour logo on brand blue or busy photos (use the white version), or box/circle the logo except for profile pictures and app icons.

### Motion & surfaces
- Smooth, purposeful animation; **3D elements on the public site only**.
- Admin dashboard uses the same palette and Poppins, but calmer: Cloud/white surfaces, no 3D. It is a work tool and must be fast.

### Voice
Short, clear, benefit-first: "We build websites that bring you customers," not "We leverage cutting-edge solutions." Speak to Tanzanian businesses directly ("you", "your business"). Kiswahili versions welcome; the tagline stays in English as part of the logo.

---

## 5. Public website — requirements

### 5.1 Global elements

**Navigation bar**
- Fixed at top; transparent over the hero, turns frosted white (Cloud/white) with a soft shadow on scroll.
- Left: horizontal logo (no tagline). Centre: Home · Services · Products · Portfolio · Blog · About · Contact. Right: "Chat on WhatsApp" button.
- Mobile: hamburger icon opens a full-screen menu with all links and a large WhatsApp button. Below 360px, logo becomes the compact icon.

**Floating WhatsApp button**
- On every page, bottom-right, green WhatsApp icon.
- Pulses once a few seconds after page load.
- Opens a WhatsApp chat with OSP Tech with a pre-filled greeting.

**Footer**
- On **navy**, using the on-dark logo (horizontal with tagline or stacked): quick links, services list, contact details, social links, copyright. A single 60° slash accent may bleed off one edge.

### 5.2 Home page sections (in order)

| # | Section | Content | Animation / interaction |
|---|---|---|---|
| 1 | **Hero** | Ground: **deep navy** for maximum 3D impact. Tag label: "IT & SYSTEMS COMPANY · TANZANIA". Headline (display, the tagline): "Turning Ideas Into Digital Solutions." Sub-line describing services. Buttons: **Explore Our Services** (blue), **Chat With Us** (outlined, WhatsApp). | 3D network of glowing blue/teal nodes reacting to mouse; rotating 3D OSP logo; headline animates word by word; scroll indicator. Faint oversized navy icon behind for depth. |
| 2 | **Trust strip** | Projects delivered, systems running, clients, support availability. | Numbers count up when in view. |
| 3 | **Services** ("What We Do") | 4 cards on white/Cloud: Business Systems; Websites & E-commerce; Business Automation; AI for Business. Each with icon, short text, "Learn more", WhatsApp icon. | Cards rise in one by one; subtle tilt on hover; teal accent line on hover. |
| 4 | **Products** ("Ready-Made Systems") | OSP WiFi Billing System; Rental Management System ("Coming soon"). Mockups in device frames. Buttons: View Details, Ask on WhatsApp. | Fade/slide in; mockups float gently. |
| 5 | **How We Work** | 4 steps: Talk to us → Plan & design → Build & test → Launch & support. | Connecting line (blue→teal) draws across on scroll. |
| 6 | **Portfolio** ("Our Work") | BORNTZ, MFBMS cards with screenshots. | Hover zoom + description overlay. |
| 7 | **Blog** ("Latest From OSP Tech") | 3 latest published posts; "View all posts" link. | Fade in. Content from OSP Admin automatically. |
| 8 | **Call to action** | Navy band: "Have an idea for your business? Let's build it." Button: Start a Conversation on WhatsApp. | 60° slash + floating 3D shapes. |
| 9 | **Contact** | Form (name, phone, what you need, message) + WhatsApp, phone, email, location (Morogoro), Instagram. | Form validation feedback; success message. |

### 5.3 Other pages

| Page | Content |
|---|---|
| **Services** | One section per service: description, what's included, example use cases, WhatsApp button with service-specific message. |
| **Product detail** (one per product) | Features, screenshots, who it's for, how pricing works (e.g. WiFi billing: revenue share per transaction), FAQ, WhatsApp/demo button. |
| **Portfolio detail** (one per project) | Client/type, problem, solution, screenshots, technologies, result. |
| **Blog list** | All published posts, newest first, with pagination. |
| **Blog post** | Cover image, title, date, content, share buttons, WhatsApp CTA at the end. |
| **About** | Company story, mission, founder profile, values. |
| **Contact** | Full contact section (same as home) + map/location. |
| **404** | Branded "page not found" with link home. |

### 5.4 WhatsApp integration

**Phase 1 (v1):**
- All WhatsApp buttons use direct chat links (`wa.me/<number>?text=<message>`).
- Each button sends a **context-specific pre-filled message**, e.g. "Hello OSP Tech, I'm interested in Business Systems." or "Hello OSP Tech, I'd like a demo of the WiFi Billing System."
- Messages are editable from OSP Admin (Services & Products).
- WhatsApp number is set once in Admin Settings.

**Phase 2 (later):**
- WhatsApp Business catalogue for browsing services inside WhatsApp.
- WhatsApp Business API for automated replies and for sending reminders/notifications from OSP Admin.

### 5.5 Public website — functional requirements

| ID | Requirement | Priority |
|---|---|---|
| W-1 | All service, product, portfolio and blog content is loaded from the database and editable in OSP Admin. | Must |
| W-2 | Every service and product has a WhatsApp button with its own pre-filled message. | Must |
| W-3 | Contact form submissions are saved to the database and appear in Admin → Messages. | Must |
| W-4 | Contact form has spam protection (honeypot field + rate limiting). | Must |
| W-5 | Only posts with status "Published" appear on the site. | Must |
| W-6 | Each page has its own title, meta description and social share image (SEO). | Must |
| W-7 | Sitemap and robots file generated automatically. | Should |
| W-8 | Basic analytics: page views and WhatsApp button clicks. | Should |
| W-9 | Kiswahili language toggle. | Won't-yet (English-only at launch; data model stays localisation-ready) |
| W-10 | Site renders strictly within the brand palette and Poppins type; logo variants used per the usage rules. | Must |

---

## 6. OSP Admin — requirements

### 6.1 Access
- URL: `/admin`. Login with email and password.
- v1 roles: **Owner** (full access). Later: **Staff** (projects and reminders only, no finance).
- Session timeout after inactivity; password reset by email.

### 6.2 Layout
- Left sidebar: Dashboard · Projects · Reminders · Finance · Posts · Services & Products · Portfolio · Messages · Settings.
- On mobile, sidebar collapses into a menu.

### 6.3 Dashboard (home)
- Greeting + today's date.
- **Summary cards:** Income this month · Expenses this month · Profit this month · Active projects.
- **Chart:** income vs expenses, last 6 months.
- **Upcoming reminders:** due today, this week, overdue (red).
- **Active projects:** name, client, progress bar, deadline.
- **New messages count** from the contact form.

### 6.4 Projects

| ID | Requirement | Priority |
|---|---|---|
| P-1 | Create/edit/archive projects with: name, client, client phone, type (custom system / website / system rental / automation / AI / other), description, agreed price (TZS), start date, deadline, status. | Must |
| P-2 | Statuses: Planning → In Progress → Testing → Completed (plus On Hold, Cancelled). | Must |
| P-3 | Board view (drag cards between status columns) and list view. | Must |
| P-4 | Task checklist inside each project; progress % calculated from completed tasks. | Must |
| P-5 | Show amount paid vs agreed price per project (linked from Finance income records). | Must |
| P-6 | Overdue projects highlighted. | Must |
| P-7 | Notes / activity log per project. | Should |
| P-8 | Attach files (contracts, designs) to a project. | Could |

### 6.5 Reminders

| ID | Requirement | Priority |
|---|---|---|
| R-1 | Create reminders with title, description, due date and time, optional link to a project or client. | Must |
| R-2 | Mark as done; overdue reminders highlighted. | Must |
| R-3 | List view (Today / This week / Later / Overdue) and calendar view. | Must |
| R-4 | Repeating reminders (daily, weekly, monthly), e.g. monthly hosting renewal. | Should |
| R-5 | Notifications by email. | Should |
| R-6 | Notifications by WhatsApp. | Phase 2 |

### 6.6 Finance

| ID | Requirement | Priority |
|---|---|---|
| F-1 | Record **income**: date, amount (TZS), client, linked project (optional), payment method (M-Pesa, Mixx by Yas/Tigo Pesa, Airtel Money, HaloPesa, bank, cash), reference number, notes. | Must |
| F-2 | Record **expenses**: date, amount, category, payment method, description, receipt photo upload. | Must |
| F-3 | Default expense categories: Internet & data, Hosting & domains, Software & subscriptions, Equipment, Transport, Marketing & ads, Office, Other. Categories editable. | Must |
| F-4 | Monthly summary: total income, total expenses, profit/loss. | Must |
| F-5 | Charts: income vs expenses over time; expenses by category. | Must |
| F-6 | Filter by date range, category, project, payment method. | Must |
| F-7 | Export reports to PDF and Excel/CSV. | Should |
| F-8 | Recurring expenses (e.g. monthly hosting). | Should |
| F-9 | Track WiFi Billing System revenue-share earnings as a separate income category. | Should |
| F-10 | Simple invoices/receipts generated from income records (branded per logo rules). | Could |

All amounts in **Tanzanian Shillings (TZS)**, formatted with thousands separators (e.g. TZS 1,250,000).

### 6.7 Posts (blog)

| ID | Requirement | Priority |
|---|---|---|
| B-1 | Create/edit posts: title, slug, cover image, summary, rich-text body (headings, lists, images, links). | Must |
| B-2 | Status: Draft / Published; publish date. | Must |
| B-3 | Published posts appear automatically on the website. | Must |
| B-4 | SEO fields per post (meta title, meta description). | Should |
| B-5 | Categories/tags. | Could |

### 6.8 Services & Products

| ID | Requirement | Priority |
|---|---|---|
| S-1 | Edit services: name, icon, short description, full description, display order, WhatsApp pre-filled message, visible/hidden. | Must |
| S-2 | Edit products: name, description, features list, screenshots, pricing text, badge (e.g. "Coming soon"), WhatsApp message, visible/hidden. | Must |
| S-3 | Changes reflect on the public site without code changes. | Must |

### 6.9 Portfolio
- Add/edit portfolio projects: title, type, description, screenshots, technologies, live link, display order, visible/hidden. (Must)

### 6.10 Messages
- List of contact form submissions: name, phone, need, message, date, status (New / Replied / Closed). (Must)
- "Reply on WhatsApp" button opens a chat with that person's number. (Must)
- Convert a message into a project or reminder. (Should)

### 6.11 Settings
- Company details: name, tagline, WhatsApp number, phone, email, location, social links. (Must)
- Trust-strip numbers shown on the home page. (Must)
- User account: change password. (Must)
- Manage users and roles. (Later)

---

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| **Performance** | Public pages load fast on mid-range Android phones on 3G/4G. Target: Largest Contentful Paint under 3 s on mobile 4G; Lighthouse performance score ≥ 85 on mobile. |
| **3D fallback** | 3D scenes load after the main content. On low-power devices, slow connections or when the user prefers reduced motion, show a lightweight animated/static version instead. |
| **Image optimisation** | Modern formats (WebP/AVIF), responsive sizes, lazy loading. |
| **Responsive** | Fully usable from 360 px phone width to large desktop. Mobile-first. |
| **Accessibility** | WCAG 2.1 AA target. Blue-Strong (#2457D6) for small text/links on white; brand blue only for 24px+ headings. Keyboard navigation, alt text, respects "reduce motion". |
| **Brand fidelity** | Only the seven brand tokens and Poppins are used. Logo variants follow the usage rules. Teal never used for large areas or long body text on white. |
| **Security** | HTTPS everywhere; admin routes protected server-side; passwords hashed; input validation; rate limiting on login and contact form; database access rules so the public can only read published content. |
| **Data safety** | Automatic daily database backups. Finance data never exposed publicly. |
| **SEO** | Server-rendered pages, clean URLs, meta tags, Open Graph images, sitemap. |
| **Maintainability** | Clean, documented code; content managed via Admin, not hard-coded. |

---

## 8. Proposed technology stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js** (React, TypeScript) | One codebase for public site + admin; server rendering for SEO and speed. |
| Styling | **Tailwind CSS** + brand tokens | Brand colours and spacing as tokens; small production CSS. |
| Fonts | **Poppins** via `next/font` (Google Fonts) | Brand type; self-hosted/subset for speed; Arial fallback. |
| 3D | **Three.js** via React Three Fiber | Real-time 3D logo and node network. |
| Animation | **GSAP** (ScrollTrigger) and/or Framer Motion | Scroll reveals, text animations, timelines. |
| Database & auth | **Supabase** (PostgreSQL + Auth + Storage) | Database, login and file storage in one service; generous free tier. |
| Charts | Recharts | Finance and dashboard charts. |
| Rich text | Tiptap editor | Blog post writing. |
| Email | Resend (or similar) | Reminder emails, password reset. |
| Hosting | Vercel (site) + Supabase (data) | Easy deploys, global CDN. |
| Domain | **`.com`** (decided) | International reach. |

Stack is a proposal and can change before development starts. Full detail in **architecture.md**.

---

## 9. Data model (summary)

The initial tables are: `users`, `settings`, `services`, `products`, `portfolio_items`, `posts`, `clients`, `projects`, `project_tasks`, `reminders`, `income`, `expenses`, `expense_categories`, `messages`, `events`. Full columns, types, relationships, indexes and RLS live in **database.md**.

---

## 10. Release plan

| Phase | Scope | Outcome |
|---|---|---|
| **Phase 0: Design** | Brand token system + Poppins set up; hero prototype (3D logo + navy node background) and tiered fallback; approval of look. | Confirms the visual direction before full build. |
| **Phase 1: Public website** | All public pages and sections, WhatsApp links, contact form, SEO, content seeded manually. | OSP Tech is live and receiving leads. |
| **Phase 2: Admin core** | Login, Dashboard, Services & Products, Portfolio, Posts, Messages, Settings. | Site content managed without code. |
| **Phase 3: Business tools** | Projects, Reminders, Finance, reports, exports, email notifications. | Founder runs the business from OSP Admin. |
| **Phase 4: Growth** | WhatsApp Business API, WhatsApp reminders, staff roles, invoices, Kiswahili version, client portal (if needed). | Automation and scale. |

Step-by-step build detail in **implementation.md**.

---

## 11. Success metrics

| Metric | Target |
|---|---|
| WhatsApp conversations started from the site | Track monthly; growing month on month |
| Contact form submissions | Track monthly |
| Clients won | ~10 by end of 2026 (combined with Instagram) |
| Mobile page speed | Lighthouse ≥ 85, LCP < 3 s |
| Admin usage | All income and expenses recorded in OSP Admin each month |
| Content | At least 2 blog posts per month |

---

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| 3D makes the site slow on phones | Load 3D after content, device/connection checks, lightweight fallback. |
| Too much scope for a solo founder | Phased release; public site first. |
| Finance data leak | Admin-only access, server-side checks, database security rules, backups (see security.md). |
| Content becomes outdated | All content editable from Admin; reminder to post regularly. |
| Hosting costs grow | Start on free tiers; monitor usage. |
| Brand drift | Tokens enforced in code; UI-UX.md is the single reference; logo usage rules documented. |

---

## 13. Decisions & open questions

### Decided
- **Language:** **English only** at launch. (Kiswahili is not planned for v1; the data model still stays localisation-ready in case it's added later.)
- **Domain:** **.com** (e.g. `osptech.com`).
- **Official WhatsApp number:** **0747809299** → international **+255747809299** → `wa.me` form **`255747809299`**.
- **Colour/typography:** closed by the brand kit — exact tokens and Poppins fixed in Section 4 and UI-UX.md.

### Still open
1. Show **prices** on the website, or "contact for price"?
2. Will staff/collaborators need Admin access in the first year?
3. Is a client portal (clients see their project progress) wanted later?
4. Should the Rental Management System appear publicly before it's ready ("Coming soon") or be hidden?
5. Business email address to use (e.g. info@...).
