# OSP Tech

The OSP Technologies website and OSP Admin dashboard — one Next.js app serving
a public marketing site and a private business dashboard from the same
codebase and the same Supabase database.

Full documentation lives in [`MD Files/`](./MD%20Files/). Start with
[`agents.md`](./agents.md) — the enforceable rules — then the doc for whatever
you are touching. [`UI-UX.md`](./MD%20Files/UI-UX.md) is the single source of
truth for brand.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres, Auth,
Storage) · Zod · React Three Fiber · Framer Motion · Tiptap · Recharts ·
Vercel.

## Getting started

```bash
npm install

# Start the local Supabase stack (needs Docker Desktop running).
# The first run pulls several GB of images and takes a while.
npx supabase start

# Faster, if you only need the public site and admin:
# npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor,mailpit

# Copy the API URL and anon key it prints into .env.local
cp .env.example .env.local

# Apply migrations and seed content
npm run db:reset

npm run dev
```

The site runs at <http://localhost:3000>. With the full stack, Supabase Studio
is at <http://localhost:54323>.

### Creating the owner account

There is no public sign-up. Provision the single owner with the Admin API,
using the service-role key from `npx supabase status`:

```bash
curl -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"a-long-password","email_confirm":true,
       "user_metadata":{"full_name":"Your Name"}}'
```

The `handle_new_user` trigger makes the **first** account the owner; any later
one defaults to `staff`, which has no access in v1.

## Scripts

| Script              | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Development server                                       |
| `npm run build`     | Production build                                         |
| `npm run typecheck` | `tsc --noEmit`                                           |
| `npm run lint`      | ESLint                                                   |
| `npm run format`    | Prettier, write                                          |
| `npm run db:reset`  | Re-apply all migrations and re-seed the local database   |
| `npm run db:types`  | Regenerate `lib/types/database.ts` from the local schema |

## How it is organised

```
app/
  (public)/   public site — statically rendered, revalidated hourly
  (admin)/    OSP Admin — force-dynamic, owner-only
  actions/    Server Actions, grouped by domain
  api/        route handlers: finance export, reminder cron
components/
  ui/         branded primitives, <Logo>, <Slash>
  public/     hero, 3D island, home sections
  admin/      shell, forms, tables, kanban, charts
lib/
  supabase/   server, static, browser and service clients
  db/         typed queries (queries = public, admin + business = owner)
  auth/       session and role guards
  validation/ Zod schemas, shared client and server
  whatsapp/   wa.me link builder
  format/     TZS and Africa/Dar_es_Salaam dates
supabase/
  migrations/ timestamped SQL — schema and RLS together
  seed.sql
proxy.ts      session refresh + first gate on /admin
```

## Working on this

- **Brand tokens only.** Raw hex belongs in `app/globals.css`. The one
  exception is `lib/brand/tokens.ts`, for contexts CSS variables cannot reach
  (email HTML, the printable report, `<meta>` tags, chart SSR fallbacks).
- **Validate on the client and the server.** The server decides.
- **Schema changes are migrations**, with their RLS policies in the same file.
  Never edit a shipped migration.
- **Money is `bigint` whole TZS**, carried as a string in app code. Format only
  at display, with `lib/format`.
- **Admin actions check session + role**, and RLS refuses underneath.
- Before opening a PR, walk the checklist in
  [`workflows.md`](./MD%20Files/workflows.md) §A6.

## Build phases

Phases 0–3 are built: the design system and 3D hero, the public site, OSP
Admin content management, and the business tools (clients, projects, reminders,
finance). Phase 4 (WhatsApp Business API, staff role, invoices, Kiswahili) is
not started — see [`implementation.md`](./MD%20Files/implementation.md).
