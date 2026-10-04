# UI / UX & Design System — OSP Tech

| | |
|---|---|
| **Product** | OSP Tech website + OSP Admin |
| **Owner** | Omar Suleiman Pembe, Founder, OSP Tech |
| **Version** | 1.0 |
| **Date** | 4 October 2026 |
| **Source of truth** | OSP Tech Brand Guidelines + logo pack (this doc operationalises them for the product) |

This is the single reference for how OSP Tech's digital products look and feel. Every colour, font and spacing value used in code traces back to here. If something isn't in this document, it isn't on brand.

---

## 1. Brand foundations (from the guidelines)

**What the identity is built from:** the linked **OSP icon** (two chain links reading "OSP"), the bold **italic wordmark**, and the **60° slash**. Everything else — colour, type, layout — supports those three.

**Personality**
- **Confident and forward-moving** — the italic wordmark and 60° slash lean forward; layouts feel energetic but uncluttered.
- **Professional, not corporate** — clean white **or** deep navy grounds, generous space, one strong headline.
- **Local and practical** — plain, friendly language; English **or** Kiswahili, never both in one headline.

---

## 2. Colour

### 2.1 Palette (exact)

| Token | HEX | RGB | Role |
|---|---|---|---|
| `blue` | **#3871FC** | 56, 113, 252 | Logo, wordmark, big headlines, blocks, primary buttons |
| `blue-strong` | **#2457D6** | 36, 87, 214 | Small links and button text on white |
| `teal` | **#04BCC8** | 4, 188, 200 | **Accent only** — one keyword, a line, the slash |
| `navy` | **#081B33** | 8, 27, 51 | Dark backgrounds, logo bars, body text |
| `cloud` | **#F3F6FB** | 243, 246, 251 | Light section backgrounds |
| `slate` | **#5B6576** | 91, 101, 118 | Secondary text |
| `white` | **#FFFFFF** | 255, 255, 255 | Primary light ground; PWA background |

PWA/theme colour: **#3871FC**. Background colour: **#FFFFFF** (from `site.webmanifest`).

### 2.2 The 60/30/10 ratio
Every screen should land near **60% white or navy ground · 30% brand blue · 10% teal**. Teal is the accent: a single key word, a thin line, a hover state, or the slash graphic. **Never** use teal for large fills or long body text on white.

### 2.3 Accessibility rules (non-negotiable)
- Brand blue (#3871FC) on white = **4.25:1** → OK for text **24px and larger** only. For anything smaller (links, buttons, labels, captions) on white, use **Blue Strong (#2457D6)**.
- Teal on white is **decorative only** — never body text.
- Teal on navy = **7.4:1** → excellent; good for accent text/lines on dark sections.
- Navy on white and white on navy are both strong — use freely for body text.
- Target **WCAG 2.1 AA** across the product. Run the accessibility review before any handoff.

### 2.4 Suggested semantic mapping (admin + states)
These extend the palette for UI states without introducing new brand colours where avoidable:

| Purpose | Value |
|---|---|
| Primary action | `blue` (#3871FC), text white |
| Primary action (small text) | `blue-strong` (#2457D6) |
| Success | `#1CA05C` (reserved, finance "profit"/paid) |
| Warning / overdue | `#E3A008` |
| Danger / destructive | `#E5484D` |
| Positive accent / highlight | `teal` |
| Neutral surfaces | `cloud`, `white`; borders `#E3E8F0` |
| Text: primary / secondary | `navy` / `slate` |

> State colours (success/warning/danger) are functional UI colours, kept muted so they never compete with brand blue/teal. They are not part of the marketing palette.

---

## 3. Typography

**One family: Poppins** (Google Fonts, loaded via `next/font`; Arial fallback).

| Style | Font / weight | Use |
|---|---|---|
| **Display** | Poppins ExtraBold **Italic** (800) | Hero headline (the tagline), section headlines, short punchy phrases. Matches the wordmark. |
| **Heading** | Poppins Bold (700) / SemiBold (600), upright | Page and card headings. |
| **Body** | Poppins Regular (400) | Paragraphs, 16px on web. |
| **Label** | Poppins SemiBold (600), UPPERCASE, +0.06em tracking | Eyebrows, tags, table headers (e.g. FOUNDER, SERVICES). |

### 3.1 Type scale (web, mobile-first; rem @16px base)

| Token | Size (desktop) | Line height | Style |
|---|---|---|---|
| display-xl | 3.5rem / 56px | 1.05 | Display italic |
| display-l | 2.5rem / 40px | 1.1 | Display italic |
| h1 | 2rem / 32px | 1.15 | Bold |
| h2 | 1.5rem / 24px | 1.2 | Bold |
| h3 | 1.25rem / 20px | 1.3 | SemiBold |
| body-lg | 1.125rem / 18px | 1.6 | Regular |
| body | 1rem / 16px | 1.6 | Regular |
| small | 0.875rem / 14px | 1.5 | Regular |
| label | 0.75rem / 12px | 1.4 | SemiBold caps |

On phones, step display/h1 down ~25–30% (e.g. display-xl → ~38px) to avoid overflow. Headlines stay italic display; body stays regular.

### 3.2 Rules
- One strong headline per section (personality rule). Don't stack multiple display lines.
- Display italic is for headlines and short phrases **only** — never body paragraphs.
- Keep line length 60–75 characters for body.

---

## 4. Logo usage in product

Use the kit SVGs from `public/brand/`. A `<Logo>` component centralises the rules.

| Placement | Variant | Notes |
|---|---|---|
| Header / nav bar | `osp-logo.svg` (horizontal, no tagline) | 32–44px tall. Below 360px viewport → `osp-mark-compact.svg`. |
| Hero | **none** | Logo is already in the header; the **tagline is the headline** in display type. |
| Footer (navy) | `osp-logo-on-dark.svg` (horizontal w/ tagline) or stacked | Bars/words turn white on navy. |
| On brand-blue or busy photo | `osp-logo-white.svg` | Never the colour logo on blue/photos. |
| One-colour / stamp | `osp-logo-navy.svg` | Single colour. |
| Favicon / app icon | `favicon/` folder + compact mark | Already generated in the kit. |
| Social share / link preview | horizontal w/ tagline on white | Default OG image. |

**Clear space:** keep empty space around the logo at least equal to the height of the navy bars under the icon (~14% of icon height).

**Minimum sizes (screen):** primary with tagline 220px wide; horizontal without tagline 120px; icon 24px. Below 32px, use the compact icon (bars drop).

**Don'ts:** no stretch/squash/rotate/shadow/glow/outline; no recolouring; no rebuilding the wordmark in another font; no colour logo on blue or busy photos; no box/circle except profile pictures and app icons.

---

## 5. The 60° slash (signature graphic)

- Two–three parallelogram bars cut at **60°**, in blue and teal, usually **bleeding off a bottom or right edge**.
- **One per layout** — a section corner, the end of the footer band, the edge of a card. Never a busy repeating pattern.
- On navy sections, a **very faint oversized navy icon** (a shade lighter than the background) may sit behind content for depth.
- Implement as an SVG component (`<Slash />`) with blue/teal fills from tokens, positioned absolutely and clipped by the section.

---

## 6. Layout & spacing

- **Grid:** 12-column, max content width ~1200px; 16px side gutters on mobile (never horizontal scroll).
- **Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48, 64, 96. Generous whitespace is part of the brand ("generous space").
- **Radius:** cards/buttons 14px; pills/badges fully rounded; inputs 10px.
- **Elevation:** soft shadows only (e.g. `0 8px 24px rgba(8,27,51,0.08)`), never hard or neon.
- **Breakpoints:** 360 (small phone), 640 (phone), 768 (tablet), 1024 (laptop), 1280 (desktop). Mobile-first.
- **Sections:** alternate white and Cloud (#F3F6FB) grounds for rhythm; use navy for the hero, the CTA band, and the footer.

---

## 7. Core components

### Public site
- **Buttons:** Primary (blue fill, white text, 14px radius); Secondary (navy outline on white / white outline on navy); WhatsApp (brand-green `#25D366` + icon — this green is functional, not part of the palette, used only for WhatsApp affordances). Hover: slight lift + teal underline/line accent.
- **Nav bar:** transparent over hero → frosted white on scroll; logo left, links centre, WhatsApp button right.
- **Service card:** icon in a blue/teal gradient chip, h3 title, short text, "Learn more" (blue-strong), WhatsApp icon. Hover: lift + teal top line.
- **Product card:** device-frame mockup, title, badge (e.g. "Coming soon" in slate pill), two buttons.
- **Trust strip:** count-up stats on navy or Cloud.
- **Floating WhatsApp FAB:** green, bottom-right, one pulse after load.
- **Footer:** navy, on-dark logo, link columns, socials, one slash accent.

### Admin
- **Sidebar:** white/Cloud, blue active item, Poppins labels; collapses on mobile.
- **Stat cards:** label (caps), big number (bold navy), small trend (green/amber).
- **Tables:** Cloud header row, slate secondary text, row hover, status pills.
- **Kanban board:** columns Planning/In Progress/Testing/Completed; draggable cards; overdue = amber/red left border.
- **Forms:** shadcn inputs, Zod-driven inline validation, clear error text in danger colour.
- **Charts (Recharts):** series in blue, teal, slate, amber; never rely on colour alone — label series. Follow the dataviz skill for palette discipline.

---

## 8. Motion

- **Purposeful, smooth** — supports the "forward-moving" personality, never decoration for its own sake.
- **Public site:** hero 3D (node network + rotating logo), word-by-word headline reveal, cards rise on scroll, "How we work" line draws blue→teal, gentle float on mockups, CTA floating shapes.
- **Durations:** 150–300ms for UI transitions; scroll reveals ~400–600ms with easing.
- **Reduced motion:** honour `prefers-reduced-motion` — swap 3D for a static navy hero, disable parallax and auto-animations.
- **Admin:** minimal — subtle transitions only; it's a work tool.

---

## 9. Imagery & iconography

- **Icons:** one consistent line/duotone set (e.g. Lucide), coloured in navy/blue; teal only for accents.
- **Photos:** real, bright, Tanzanian context where possible; never put the colour logo on a busy photo (use white logo).
- **Illustration:** geometric, echoing the chain-link and 60° angle; blue/teal/navy only.

---

## 10. Key UX flows (success criteria)

1. **Visitor → WhatsApp lead:** land on hero → understand offer in <5s → tap a context WhatsApp button → chat opens with the right pre-filled message. Every service/product exposes this in ≤1 tap.
2. **Visitor → contact form:** fill name/phone/need/message → inline validation → success state → message lands in Admin.
3. **Owner → record income/expense:** login → Finance → add entry in <30s → dashboard totals update.
4. **Owner → publish post:** Posts → write → Publish → appears on public blog within the revalidation window.
5. **Owner → track a project:** Projects board → drag card across statuses → progress reflects task checklist → overdue flagged.

---

## 11. Content & voice (UX writing)

- Short, clear, **benefit-first**: "We build websites that bring you customers," not "We leverage cutting-edge solutions."
- Address the reader directly: "you", "your business".
- Buttons are verbs: "Explore Our Services", "Chat With Us", "Start a Conversation".
- **This product ships English-only in v1** — write all site and admin copy in English. (The brand voice allows Kiswahili generally; a Kiswahili site version is a possible later addition, never mixing both in one headline. The tagline always stays in English as part of the logo.)
- Error/empty states: plain and helpful ("No projects yet — add your first one.").

---

## 12. Definition of "on brand" (checklist)

- [ ] Only the 7 palette tokens (+ muted functional state colours) appear; no stray hex.
- [ ] 60/30/10 ratio holds; teal is accent only.
- [ ] Small text/links on white use Blue Strong; headings 24px+ may use blue.
- [ ] Poppins only; display is italic 800, body is regular 400.
- [ ] Correct logo variant for the background; clear space and min size respected.
- [ ] At most one 60° slash per layout.
- [ ] One strong headline per section; generous whitespace.
- [ ] Reduced-motion and keyboard paths work; AA contrast verified.
