# Database Design — OSP Tech

| | |
|---|---|
| **Product** | OSP Tech website + OSP Admin |
| **Database** | Supabase PostgreSQL |
| **Version** | 1.0 |
| **Date** | 4 October 2026 |
| **Companion docs** | architecture.md · security.md · API.md |

This document defines the full data model: tables, columns, types, relationships, indexes, enums, Row-Level Security (RLS), storage buckets, and seed data. All identifiers are `snake_case`; all tables live in the `public` schema unless noted.

---

## 1. Conventions

- **Primary keys:** `id uuid primary key default gen_random_uuid()`.
- **Timestamps:** `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()` (updated via trigger).
- **Money:** stored in **TZS** as `bigint` representing **whole shillings** (TZS has no minor unit in practice). Format with separators in the UI.
- **Time zone:** store `timestamptz` (UTC); display in `Africa/Dar_es_Salaam`.
- **Soft visibility:** public-facing content tables use `visible boolean` and/or `status` rather than hard deletes.
- **Ordering:** content tables have `sort_order int default 0`.
- **Enums:** Postgres `enum` types for fixed sets (see §3).

---

## 2. Entity-relationship overview

```
auth.users (Supabase)
     │ 1:1
     ▼
  profiles ──< (owner of everything in admin)
                         
clients ──1:N── projects ──1:N── project_tasks
   │                 │
   │                 ├──1:N── income        (also linked to client)
   │                 └──1:N── reminders
   │
   └──1:N── income / reminders (optional client link)

expense_categories ──1:N── expenses
services        (standalone, public)
products        (standalone, public)
portfolio_items (standalone, public)
posts           (standalone, public)
messages        (from contact form; may convert to project/reminder)
settings        (single row, site-wide config)
events          (analytics, append-only)
```

---

## 3. Enum types

```sql
create type user_role        as enum ('owner', 'staff');
create type project_type      as enum ('custom_system','website','system_rental','automation','ai','other');
create type project_status    as enum ('planning','in_progress','testing','completed','on_hold','cancelled');
create type post_status        as enum ('draft','published');
create type payment_method     as enum ('mpesa','mixx_tigo','airtel_money','halopesa','bank','cash','other');
create type reminder_repeat    as enum ('none','daily','weekly','monthly');
create type message_status     as enum ('new','replied','closed');
create type event_type         as enum ('page_view','whatsapp_click','contact_submit');
create type product_badge      as enum ('none','coming_soon','new','popular');
```

---

## 4. Tables

### 4.1 profiles
Mirror of `auth.users` carrying role and display info (Supabase Auth owns credentials).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| full_name | text | |
| email | text | unique; mirrored from auth |
| role | user_role | default `owner` for the first user |
| avatar_url | text | nullable |
| created_at / updated_at | timestamptz | |

### 4.2 settings
Single-row site configuration (enforce one row via a `singleton` check or `id = true`).

| Column | Type | Notes |
|---|---|---|
| id | boolean PK default true | `check (id)` → only one row |
| company_name | text | "OSP Technologies" |
| tagline | text | "Turning Ideas Into Digital Solutions." |
| whatsapp_number | text | E.164, e.g. `+2557XXXXXXXX` |
| phone | text | |
| email | text | e.g. info@... |
| location | text | "Morogoro, Tanzania" |
| socials | jsonb | `{instagram, facebook, linkedin, x, tiktok}` |
| trust_stats | jsonb | `[{label, value}]` for the trust strip |
| default_whatsapp_greeting | text | fallback pre-filled message |
| updated_at | timestamptz | |

**Public read:** only non-sensitive fields (company_name, tagline, whatsapp_number, phone, email, location, socials, trust_stats) via a view `public_settings`.

### 4.3 services

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text not null | e.g. "Business Systems" |
| slug | text unique not null | |
| icon | text | icon key (Lucide name) |
| short_desc | text | card text |
| full_desc | text | services page |
| whatsapp_message | text | pre-filled message |
| sort_order | int default 0 | |
| visible | boolean default true | |
| created_at / updated_at | timestamptz | |

### 4.4 products

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text not null | e.g. "OSP WiFi Billing System" |
| slug | text unique not null | |
| description | text | |
| features | jsonb | `string[]` |
| images | jsonb | `string[]` of storage paths |
| pricing_text | text | e.g. "Revenue share: 2.5% per transaction" |
| badge | product_badge default 'none' | |
| whatsapp_message | text | |
| sort_order | int default 0 | |
| visible | boolean default true | |
| created_at / updated_at | timestamptz | |

### 4.5 portfolio_items

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text not null | e.g. "BORNTZ" |
| slug | text unique not null | |
| type | text | "E-commerce website" |
| description | text | |
| images | jsonb | `string[]` |
| technologies | jsonb | `string[]` |
| live_url | text | nullable |
| sort_order | int default 0 | |
| visible | boolean default true | |
| created_at / updated_at | timestamptz | |

### 4.6 posts

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text not null | |
| slug | text unique not null | |
| cover_image | text | storage path |
| summary | text | |
| body | jsonb | Tiptap JSON document |
| status | post_status default 'draft' | |
| published_at | timestamptz | null until published |
| meta_title | text | SEO |
| meta_description | text | SEO |
| author_id | uuid FK → profiles.id | |
| created_at / updated_at | timestamptz | |

Index: `(status, published_at desc)` for the public blog list.

### 4.7 clients

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text not null | |
| phone | text | |
| email | text | |
| business_name | text | |
| notes | text | |
| created_at / updated_at | timestamptz | |

### 4.8 projects

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text not null | |
| client_id | uuid FK → clients.id | nullable (on delete set null) |
| type | project_type | |
| description | text | |
| price | bigint | agreed price, TZS |
| start_date | date | |
| deadline | date | |
| status | project_status default 'planning' | |
| notes | text | |
| archived | boolean default false | |
| created_at / updated_at | timestamptz | |

Indexes: `(status)`, `(deadline)`, `(client_id)`.
Derived (query-time, not stored): `amount_paid = sum(income.amount where project_id = projects.id)`; `progress = completed tasks / total tasks`.

### 4.9 project_tasks

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → projects.id on delete cascade | |
| title | text not null | |
| done | boolean default false | |
| sort_order | int default 0 | |
| created_at | timestamptz | |

### 4.10 reminders

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text not null | |
| description | text | |
| due_at | timestamptz not null | |
| repeat_rule | reminder_repeat default 'none' | |
| project_id | uuid FK → projects.id on delete set null | nullable |
| client_id | uuid FK → clients.id on delete set null | nullable |
| done | boolean default false | |
| notify_email | boolean default true | |
| notified_at | timestamptz | last email sent (dedupe) |
| created_at / updated_at | timestamptz | |

Index: `(done, due_at)` for upcoming/overdue queries.

### 4.11 expense_categories

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text unique not null | |
| sort_order | int default 0 | |

Seeded defaults in §7.

### 4.12 expenses

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| date | date not null | |
| amount | bigint not null | TZS |
| category_id | uuid FK → expense_categories.id | |
| method | payment_method | |
| description | text | |
| receipt_url | text | private storage path |
| recurring | reminder_repeat default 'none' | monthly hosting etc. |
| created_at / updated_at | timestamptz | |

Indexes: `(date)`, `(category_id)`.

### 4.13 income

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| date | date not null | |
| amount | bigint not null | TZS |
| client_id | uuid FK → clients.id on delete set null | |
| project_id | uuid FK → projects.id on delete set null | |
| method | payment_method | |
| reference | text | transaction ref |
| category | text | e.g. "WiFi revenue share", "Custom build" |
| notes | text | |
| created_at / updated_at | timestamptz | |

Indexes: `(date)`, `(project_id)`, `(client_id)`.

### 4.14 messages (contact form)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text not null | |
| phone | text | |
| need | text | the "what you need" field |
| message | text not null | |
| status | message_status default 'new' | |
| source_page | text | which page it came from |
| created_at | timestamptz | |

Insert-only for the public (anon) role; full access for owner.

### 4.15 events (analytics, append-only)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| type | event_type | |
| page | text | path |
| item | text | e.g. service slug / product slug |
| created_at | timestamptz | |

Insert-only for anon; read for owner. Consider monthly partitioning later if volume grows.

---

## 5. Row-Level Security (summary)

RLS is **enabled on every table**. Policy intent (full SQL in security.md):

| Table | Anon (public) | Authenticated owner |
|---|---|---|
| services, products, portfolio_items | SELECT where `visible = true` | ALL |
| posts | SELECT where `status = 'published'` | ALL |
| public_settings (view) | SELECT | — |
| settings | none (use view) | ALL |
| messages | INSERT only | ALL |
| events | INSERT only | SELECT |
| profiles | none | self read; owner manages |
| clients, projects, project_tasks, reminders, income, expenses, expense_categories | none | ALL |

`staff` role (Phase 4): projects, project_tasks, reminders → ALL; finance tables → none.

---

## 6. Storage buckets

| Bucket | Access | Holds |
|---|---|---|
| `public-media` | public read, owner write | portfolio images, post covers, product mockups |
| `private-media` | owner only (signed URLs) | receipt photos, project files/contracts |

DB stores the **path**, not the binary. Enforce type/size limits in the upload server action.

---

## 7. Seed data

```sql
-- settings (single row)
insert into settings (company_name, tagline, location, whatsapp_number)
values ('OSP Technologies', 'Turning Ideas Into Digital Solutions.', 'Morogoro, Tanzania', '+255747809299');

-- expense categories
insert into expense_categories (name, sort_order) values
 ('Internet & data', 1), ('Hosting & domains', 2), ('Software & subscriptions', 3),
 ('Equipment', 4), ('Transport', 5), ('Marketing & ads', 6), ('Office', 7), ('Other', 99);

-- services
insert into services (name, slug, icon, short_desc, whatsapp_message, sort_order) values
 ('Business Systems','business-systems','server','POS & inventory, rental management, WiFi billing, custom software','Hello OSP Tech, I''m interested in Business Systems.',1),
 ('Websites & E-commerce','websites-ecommerce','globe','Business websites, online stores, WhatsApp shop integration','Hello OSP Tech, I''m interested in a Website / E-commerce.',2),
 ('Business Automation','automation','workflow','Automate reports, reminders and records','Hello OSP Tech, I''m interested in Business Automation.',3),
 ('AI for Business','ai-for-business','sparkles','AI tools and training for business owners','Hello OSP Tech, I''m interested in AI for Business.',4);

-- products
insert into products (name, slug, pricing_text, badge, whatsapp_message, sort_order) values
 ('OSP WiFi Billing System','wifi-billing','Revenue share: 2.5% per transaction','popular','Hello OSP Tech, I''d like a demo of the WiFi Billing System.',1),
 ('Rental Management System','rental-management','Pricing on request','coming_soon','Hello OSP Tech, I''d like to know about the Rental Management System.',2);

-- portfolio
insert into portfolio_items (title, slug, type, sort_order) values
 ('BORNTZ','borntz','E-commerce website',1),
 ('MFBMS','mfbms','Business management system',2);
```

---

## 8. Triggers & functions

- `set_updated_at()` — BEFORE UPDATE trigger on every table with `updated_at`.
- `handle_new_user()` — on `auth.users` insert, create a `profiles` row (first user → `owner`).
- `is_owner()` — helper used by RLS policies: `exists(select 1 from profiles where id = auth.uid() and role = 'owner')`.
- Monthly finance summary can be a SQL view `v_monthly_finance(month, income_total, expense_total, profit)`.

---

## 9. Migrations

- Managed as versioned SQL files in `supabase/migrations/` (timestamped), applied via the Supabase CLI.
- Enums and tables created before policies; seed in a separate `seed.sql` run after migrations.
- Never edit a shipped migration — add a new one (see workflows.md).

---

## 10. Future (Phase 4) additions

- `invoices` (from income records), `invoice_items`.
- `translations` table or per-column `_sw` fields for Kiswahili.
- `wa_messages` / `wa_threads` for WhatsApp Business API.
- `staff` grants and per-user audit columns (`created_by`).
