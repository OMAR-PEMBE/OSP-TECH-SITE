-- =============================================================================
-- Seed data (database.md 7)
--
-- Run after migrations, never as part of one. Phase 1 serves the site from
-- these rows; Phase 2 hands editing to OSP Admin and this file stops being the
-- source of content.
--
-- Idempotent: re-running updates in place rather than erroring on a duplicate
-- slug, so `supabase db reset` and a manual re-run behave the same.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- settings (single row)
-- -----------------------------------------------------------------------------
insert into public.settings (
  id, company_name, tagline, whatsapp_number, phone, email, location,
  socials, trust_stats, default_whatsapp_greeting
) values (
  true,
  'OSP Technologies',
  'Turning Ideas Into Digital Solutions.',
  -- Decided in requirements.md 7.
  '+255747809299',
  '+255747809299',
  'info@osptech.co.tz',
  'Morogoro, Tanzania',
  jsonb_build_object(
    'instagram', 'https://instagram.com/osptechnologies',
    'facebook',  'https://facebook.com/osptechnologies',
    'linkedin',  'https://linkedin.com/company/osptechnologies',
    'x',         '',
    'tiktok',    ''
  ),
  -- Trust strip (prd.md 5.2 row 2). Numeric values count up; the suffix is
  -- kept separate so "24/7" and "15+" both render correctly.
  jsonb_build_array(
    jsonb_build_object('label', 'Projects delivered', 'value', 15,  'suffix', '+'),
    jsonb_build_object('label', 'Systems running',    'value', 6,   'suffix', ''),
    jsonb_build_object('label', 'Clients served',     'value', 12,  'suffix', '+'),
    jsonb_build_object('label', 'Support',            'value', null, 'suffix', '24/7')
  ),
  'Hello OSP Tech, I would like to know more about your services.'
)
on conflict (id) do update set
  company_name              = excluded.company_name,
  tagline                   = excluded.tagline,
  whatsapp_number           = excluded.whatsapp_number,
  phone                     = excluded.phone,
  email                     = excluded.email,
  location                  = excluded.location,
  socials                   = excluded.socials,
  trust_stats               = excluded.trust_stats,
  default_whatsapp_greeting = excluded.default_whatsapp_greeting;

-- -----------------------------------------------------------------------------
-- services
-- -----------------------------------------------------------------------------
insert into public.services (name, slug, icon, short_desc, full_desc, whatsapp_message, sort_order) values
 ('Business Systems', 'business-systems', 'server',
  'POS & inventory, rental management, WiFi billing, custom software.',
  'We build the system your business actually runs on — point of sale, stock, rentals, WiFi billing — shaped around how you already work, not around a template.',
  'Hello OSP Tech, I''m interested in Business Systems.', 1),
 ('Websites & E-commerce', 'websites-ecommerce', 'globe',
  'Business websites, online stores, WhatsApp shop integration.',
  'A fast, mobile-first website that brings you customers, with an online store and WhatsApp ordering if you sell.',
  'Hello OSP Tech, I''m interested in a Website / E-commerce.', 2),
 ('Business Automation', 'automation', 'workflow',
  'Automate reports, reminders and records.',
  'Stop re-typing the same things. We automate your reports, reminders and records so the admin work runs itself.',
  'Hello OSP Tech, I''m interested in Business Automation.', 3),
 ('AI for Business', 'ai-for-business', 'sparkles',
  'AI tools and training for business owners.',
  'Practical AI you can use today — and the training to use it well — applied to your real work, not demos.',
  'Hello OSP Tech, I''m interested in AI for Business.', 4)
on conflict (slug) do update set
  name = excluded.name, icon = excluded.icon, short_desc = excluded.short_desc,
  full_desc = excluded.full_desc, whatsapp_message = excluded.whatsapp_message,
  sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
insert into public.products (name, slug, description, features, pricing_text, badge, whatsapp_message, sort_order) values
 ('OSP WiFi Billing System', 'wifi-billing',
  'Sell WiFi vouchers and take mobile money payments, with every transaction accounted for.',
  jsonb_build_array(
    'Voucher and time-based packages',
    'M-Pesa, Mixx by Tigo and Airtel Money',
    'Live revenue dashboard',
    'Automatic daily reconciliation'
  ),
  'Revenue share: 2.5% per transaction', 'popular',
  'Hello OSP Tech, I''d like a demo of the WiFi Billing System.', 1),
 ('Rental Management System', 'rental-management',
  'Track units, tenants, rent due and receipts in one place.',
  jsonb_build_array(
    'Unit and tenant records',
    'Rent due and overdue tracking',
    'Receipts and payment history',
    'WhatsApp reminders to tenants'
  ),
  'Pricing on request', 'coming_soon',
  'Hello OSP Tech, I''d like to know about the Rental Management System.', 2)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, features = excluded.features,
  pricing_text = excluded.pricing_text, badge = excluded.badge,
  whatsapp_message = excluded.whatsapp_message, sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- portfolio
-- -----------------------------------------------------------------------------
insert into public.portfolio_items (title, slug, type, description, technologies, live_url, sort_order) values
 ('BORNTZ', 'borntz', 'E-commerce website',
  'An online store for a Tanzanian clothing brand, built for mobile data and WhatsApp ordering.',
  jsonb_build_array('Next.js', 'Supabase', 'WhatsApp'), null, 1),
 ('MFBMS', 'mfbms', 'Business management system',
  'A management system covering records, reporting and day-to-day operations for a local business.',
  jsonb_build_array('Next.js', 'PostgreSQL'), null, 2)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, description = excluded.description,
  technologies = excluded.technologies, sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- posts
--
-- Two published and one draft. The draft is deliberate: it is the row that
-- proves the public blog query and the RLS policy actually filter by status.
-- Body is Tiptap JSON, matching what the Phase 2 editor will produce.
-- -----------------------------------------------------------------------------
insert into public.posts (title, slug, summary, body, status, published_at, meta_description) values
 ('Why your business needs a website in 2026', 'why-your-business-needs-a-website',
  'Your customers are already searching. Here is what a website actually does for a Tanzanian business.',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Most people looking for what you sell start on a phone. If they cannot find you, they find someone else.'))),
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'A website is not a brochure. It is the thing that answers questions while you sleep and opens a WhatsApp chat when someone is ready to buy.')))
  )),
  'published', now() - interval '6 days',
  'Why a fast, mobile-first website matters for a Tanzanian business in 2026.'),

 ('Mobile money, reconciled automatically', 'mobile-money-reconciled',
  'Counting M-Pesa payments by hand costs you hours every week. It does not have to.',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Every shilling that comes in through mobile money can be matched to a sale automatically.')))
  )),
  'published', now() - interval '2 days',
  'How automatic mobile money reconciliation saves a small business hours every week.'),

 ('A draft that must never appear publicly', 'unpublished-draft',
  'If you can see this on the public site, the posts RLS policy is not doing its job.',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text', 'Draft body.')))
  )),
  'draft', null, null)
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, body = excluded.body,
  status = excluded.status, published_at = excluded.published_at,
  meta_description = excluded.meta_description;

-- -----------------------------------------------------------------------------
-- expense categories (database.md 7). Phase 3.
-- -----------------------------------------------------------------------------
insert into public.expense_categories (name, sort_order) values
 ('Internet & data', 1),
 ('Hosting & domains', 2),
 ('Software & subscriptions', 3),
 ('Equipment', 4),
 ('Transport', 5),
 ('Marketing & ads', 6),
 ('Office', 7),
 ('Other', 99)
on conflict (name) do update set sort_order = excluded.sort_order;
