# API & Server Interface — OSP Tech

| | |
|---|---|
| **Product** | OSP Tech website + OSP Admin |
| **Version** | 1.0 |
| **Date** | 4 October 2026 |
| **Companion docs** | architecture.md · database.md · security.md |

OSP Tech has **no separate backend API server**. The "API" is the set of **Next.js Server Actions** and **Route Handlers** inside the one app, plus the **Supabase client** used from server code. This document specifies those interfaces: inputs, outputs, auth, and errors.

---

## 1. Principles

- **Server Actions** for form submissions and admin mutations (typed, no manual fetch).
- **Route Handlers** (`app/api/*`) for things that need a URL: cron jobs, webhooks, file/report downloads, sitemap/robots.
- **Reads** on the public site go directly through the Supabase server client inside Server Components (not through a custom endpoint).
- **Validation:** every input is parsed with a **Zod** schema shared between client and server. Invalid input never reaches the database.
- **Auth:** admin actions check the session and `owner` role server-side before doing anything. RLS is the second wall.
- **Errors:** actions return a typed result `{ ok: true, data } | { ok: false, error: { code, message, fields? } }` — never throw raw to the client.

---

## 2. Standard shapes

```ts
type ActionOk<T>  = { ok: true; data: T };
type ActionErr    = { ok: false; error: { code: ErrorCode; message: string; fields?: Record<string,string> } };
type ActionResult<T> = ActionOk<T> | ActionErr;

type ErrorCode =
  | 'VALIDATION'      // Zod failed; fields map holds per-field messages
  | 'UNAUTHENTICATED' // no session
  | 'FORBIDDEN'       // session but wrong role
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'CONFLICT'        // e.g. duplicate slug
  | 'SERVER_ERROR';
```

Route handlers use matching HTTP codes: 200/201, 400 (VALIDATION), 401, 403, 404, 429, 409, 500.

---

## 3. Public endpoints (no auth)

### 3.1 `submitContactMessage` — Server Action
Creates a `messages` row from the contact form.

- **Input (Zod `contactSchema`):**
  ```ts
  { name: string(2..80), phone: string(optional, TZ format),
    need: string(optional, <=120), message: string(5..2000),
    source_page: string, website: string /* honeypot, must be empty */ }
  ```
- **Checks:** honeypot empty; rate limit (see §6); sanitise text.
- **Output:** `ActionResult<{ id: string }>`.
- **Side effects:** insert `messages`; record `events(type='contact_submit')`.
- **Errors:** `VALIDATION`, `RATE_LIMITED`.

### 3.2 `recordEvent` — Server Action (lightweight)
Records analytics.

- **Input:** `{ type: 'page_view' | 'whatsapp_click', page: string, item?: string }`
- **Output:** `ActionResult<null>` (fire-and-forget; never blocks UI).
- **Note:** rate-limited per IP; drops silently on limit.

### 3.3 Public reads (Server Components, not endpoints)
Exposed implicitly through RLS-restricted SELECTs:
- `getVisibleServices()`, `getServiceBySlug(slug)`
- `getVisibleProducts()`, `getProductBySlug(slug)`
- `getVisiblePortfolio()`, `getPortfolioBySlug(slug)`
- `getPublishedPosts({ page, pageSize })`, `getPostBySlug(slug)`
- `getPublicSettings()` (from `public_settings` view)

Each returns only rows allowed by RLS (`visible = true` / `status = 'published'`).

### 3.4 `GET /api/sitemap.xml`, `GET /api/robots.txt`
Generated from published content. Public, cached.

### 3.5 `GET /api/og?...` (optional)
Open Graph image generation; defaults to the primary horizontal logo on white.

---

## 4. Admin endpoints (auth: owner)

All require a valid session and `owner` role. Pattern: `create* / update* / delete* / list* / get*`. Each mutation revalidates affected public routes where relevant.

### 4.1 Services / Products / Portfolio
- `createService(input)`, `updateService(id, input)`, `deleteService(id)`, `reorderServices(ids[])`, `toggleServiceVisible(id)`
- Same set for **products** and **portfolio_items**.
- **Input:** matching Zod schema (see database.md columns). Slug uniqueness → `CONFLICT`.
- **Side effect:** `revalidatePath('/services' | '/products' | '/portfolio')` and the home page.

### 4.2 Posts
- `createPost(input)`, `updatePost(id, input)`, `deletePost(id)`
- `publishPost(id)` → sets `status='published'`, `published_at=now()`, revalidates `/blog` and `/blog/[slug]`.
- `unpublishPost(id)` → back to draft, revalidates.
- **Input:** title, slug, cover_image, summary, body (Tiptap JSON), meta fields.

### 4.3 Clients
- `createClient`, `updateClient`, `deleteClient`, `listClients({ search })`, `getClient(id)`.

### 4.4 Projects & tasks
- `createProject`, `updateProject`, `archiveProject`, `getProject(id)`, `listProjects({ status, search })`
- `moveProjectStatus(id, status)` — used by the kanban drag.
- `addTask(projectId, title)`, `toggleTask(taskId)`, `deleteTask(taskId)`, `reorderTasks(ids[])`.
- **Computed in `getProject`:** `amount_paid` (sum of linked income), `progress` (tasks done / total).

### 4.5 Reminders
- `createReminder`, `updateReminder`, `completeReminder(id)`, `deleteReminder(id)`
- `listReminders({ bucket: 'today'|'week'|'later'|'overdue'|'all' })`.

### 4.6 Finance
- `createIncome`, `updateIncome`, `deleteIncome`, `listIncome({ from, to, projectId, method })`
- `createExpense`, `updateExpense`, `deleteExpense`, `listExpenses({ from, to, categoryId, method })`
- `createExpenseCategory`, `updateExpenseCategory`, `deleteExpenseCategory`
- `getFinanceSummary({ from, to })` → `{ income_total, expense_total, profit, by_category[], monthly[] }`.
- **Money:** `amount` is `bigint` whole TZS; the client formats.

### 4.7 Messages
- `listMessages({ status })`, `updateMessageStatus(id, status)`, `deleteMessage(id)`
- `convertMessageToProject(id, overrides?)`, `convertMessageToReminder(id, overrides?)`.

### 4.8 Settings
- `getSettings()`, `updateSettings(input)` (company details, whatsapp_number, socials, trust_stats, greeting).
- `changePassword(input)` → via Supabase Auth.

### 4.9 Uploads
- `uploadMedia(file, { bucket })` — validates MIME (`image/png|jpeg|webp|avif`, `application/pdf` for project files) and size (e.g. ≤5MB images, ≤10MB files); returns `{ path }`. Public images → `public-media`; receipts/contracts → `private-media`.
- `getSignedUrl(path)` — for private files, short-lived.

---

## 5. Route handlers (URLs)

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/sitemap.xml` | public | Sitemap from published content |
| `GET /api/robots.txt` | public | Robots directives |
| `GET /api/health` | public | Uptime/health check |
| `GET /api/finance/export?from&to&format=pdf\|csv` | owner | Download finance report |
| `POST /api/cron/reminders` | cron secret | Send due-reminder emails; generate recurring entries |
| `POST /api/webhooks/whatsapp` | signature (Phase 2) | WhatsApp Business API inbound |

**Cron auth:** `POST /api/cron/*` requires a secret header (`x-cron-secret`) matching an env var, or Vercel Cron's signed invocation. Rejects otherwise with 401.

---

## 6. Rate limiting

| Surface | Limit (suggested) |
|---|---|
| `submitContactMessage` | 5 / 10 min / IP, 20 / day / IP |
| `recordEvent` | 60 / min / IP (drops over) |
| Login (`/login`) | 10 / 15 min / IP, then backoff |
| Finance export | 30 / hour / user |

Implementation: Upstash Redis or Supabase-backed counter keyed by IP (+ user for authed routes). Over limit → `RATE_LIMITED` / HTTP 429.

---

## 7. WhatsApp link builder (not an endpoint, but the contract)

`lib/whatsapp/buildLink(number, message)` → `https://wa.me/<digits>?text=<urlEncoded(message)>`.
- `number`: from `settings.whatsapp_number`, digits only (strip `+` and spaces). Official number `+255747809299` → `255747809299`. Example: `https://wa.me/255747809299?text=Hello%20OSP%20Tech%2C%20I'm%20interested%20in%20Business%20Systems.`
- `message`: per-item `whatsapp_message` or the default greeting.
- Clicks call `recordEvent({ type:'whatsapp_click', item })` before navigation.

Phase 2 replaces/extends this module with the Cloud API client; callers are unchanged.

---

## 8. Validation schemas (location)

All Zod schemas live in `lib/validation/*.ts`, one file per domain (`contact.ts`, `project.ts`, `finance.ts`, `post.ts`, `settings.ts`, …), imported by both the form component and the server action so client and server validate identically.

---

## 9. Error handling & logging

- Actions catch, log server-side (with request id), and return the typed `ActionErr`; raw messages/stack never reach the client.
- `SERVER_ERROR` returns a generic message; details go to the error tracker (Sentry).
- Form actions return `fields` so the UI can show per-field errors inline.

---

## 10. Versioning & stability

- Server Actions are internal to the app; no public versioned API in v1.
- If a public/partner API is ever needed, expose it under `/api/v1/*` with token auth — out of scope for v1–v3.
