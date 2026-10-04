import "server-only";

import { createStaticClient } from "@/lib/supabase/server";

/**
 * Typed public reads (API.md 3.3).
 *
 * Every query here runs as the anon role, so RLS — not this file — is what
 * guarantees a draft post or a hidden service never comes back. The `visible`
 * and `status` filters below are duplicated on purpose: they make the intent
 * readable at the call site and let the partial indexes do their work, but
 * deleting one would not expose anything, because the database would still
 * refuse the rows.
 *
 * `server-only` makes importing this from a Client Component a build error
 * rather than a runtime surprise.
 */

/* ---------------------------------------------------------------- settings */

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  x?: string;
  tiktok?: string;
};

export type TrustStat = {
  label: string;
  /** Null for a stat that is not a number to count up, such as "24/7". */
  value: number | null;
  suffix?: string;
};

export type PublicSettings = {
  companyName: string;
  tagline: string;
  whatsappNumber: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  socials: SocialLinks;
  trustStats: TrustStat[];
  defaultWhatsappGreeting: string | null;
};

/**
 * Site-wide settings, from the `public_settings` view.
 *
 * The view, never the table: `settings` has no anon policy at all, so a column
 * added there later is private until someone deliberately adds it to the view
 * (security.md 3).
 */
export async function getPublicSettings(): Promise<PublicSettings | null> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("public_settings")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`getPublicSettings: ${error.message}`);
  if (!data) return null;

  return {
    companyName: data.company_name ?? "OSP Technologies",
    tagline: data.tagline ?? "",
    whatsappNumber: data.whatsapp_number,
    phone: data.phone,
    email: data.email,
    location: data.location,
    socials: (data.socials ?? {}) as SocialLinks,
    trustStats: (data.trust_stats ?? []) as TrustStat[],
    defaultWhatsappGreeting: data.default_whatsapp_greeting,
  };
}

/* ---------------------------------------------------------------- services */

export type Service = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  shortDesc: string | null;
  fullDesc: string | null;
  whatsappMessage: string | null;
};

export async function getVisibleServices(): Promise<Service[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, slug, icon, short_desc, full_desc, whatsapp_message")
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getVisibleServices: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    shortDesc: row.short_desc,
    fullDesc: row.full_desc,
    whatsappMessage: row.whatsapp_message,
  }));
}

/* ---------------------------------------------------------------- products */

export type ProductBadge = "none" | "coming_soon" | "new" | "popular";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  features: string[];
  images: string[];
  pricingText: string | null;
  badge: ProductBadge;
  whatsappMessage: string | null;
};

export async function getVisibleProducts(): Promise<Product[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, features, images, pricing_text, badge, whatsapp_message",
    )
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getVisibleProducts: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    features: (row.features ?? []) as string[],
    images: (row.images ?? []) as string[],
    pricingText: row.pricing_text,
    badge: row.badge as ProductBadge,
    whatsappMessage: row.whatsapp_message,
  }));
}

/* --------------------------------------------------------------- portfolio */

export type PortfolioItem = {
  id: string;
  title: string;
  slug: string;
  type: string | null;
  description: string | null;
  images: string[];
  technologies: string[];
  liveUrl: string | null;
};

export async function getVisiblePortfolio(): Promise<PortfolioItem[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select(
      "id, title, slug, type, description, images, technologies, live_url",
    )
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getVisiblePortfolio: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    type: row.type,
    description: row.description,
    images: (row.images ?? []) as string[],
    technologies: (row.technologies ?? []) as string[],
    liveUrl: row.live_url,
  }));
}

/* ------------------------------------------------------------------- posts */

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  publishedAt: string;
};

/**
 * Published posts, newest first.
 *
 * Drafts are excluded by RLS as well as by this filter — the seed deliberately
 * contains a draft so that guarantee is observable rather than assumed.
 */
export async function getPublishedPosts({
  limit,
}: { limit?: number } = {}): Promise<PostSummary[]> {
  const supabase = createStaticClient();

  let query = supabase
    .from("posts")
    .select("id, title, slug, summary, cover_image, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(`getPublishedPosts: ${error.message}`);

  return (data ?? []).flatMap((row) =>
    /* The schema's check constraint guarantees published_at is set on a
       published row; this narrows the nullable column type without a cast. */
    row.published_at
      ? [
          {
            id: row.id,
            title: row.title,
            slug: row.slug,
            summary: row.summary,
            coverImage: row.cover_image,
            publishedAt: row.published_at,
          },
        ]
      : [],
  );
}

/* ------------------------------------------------- single-item lookups ---- */

/**
 * Detail-page lookups.
 *
 * Each returns null rather than throwing when the slug does not match, so the
 * page can call `notFound()` and render the branded 404 instead of a 500.
 * `maybeSingle()` is deliberate: `single()` treats "no rows" as an error, which
 * would turn every mistyped URL into a server error in the logs.
 *
 * A hidden or draft row is indistinguishable from a missing one here, because
 * RLS filters it out before this code sees it. That is the correct behaviour:
 * guessing the slug of an unpublished post must not confirm it exists.
 */

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, slug, icon, short_desc, full_desc, whatsapp_message")
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();

  if (error) throw new Error(`getServiceBySlug: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    icon: data.icon,
    shortDesc: data.short_desc,
    fullDesc: data.full_desc,
    whatsappMessage: data.whatsapp_message,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, features, images, pricing_text, badge, whatsapp_message",
    )
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();

  if (error) throw new Error(`getProductBySlug: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    features: (data.features ?? []) as string[],
    images: (data.images ?? []) as string[],
    pricingText: data.pricing_text,
    badge: data.badge as ProductBadge,
    whatsappMessage: data.whatsapp_message,
  };
}

export async function getPortfolioBySlug(
  slug: string,
): Promise<PortfolioItem | null> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select(
      "id, title, slug, type, description, images, technologies, live_url",
    )
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();

  if (error) throw new Error(`getPortfolioBySlug: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    type: data.type,
    description: data.description,
    images: (data.images ?? []) as string[],
    technologies: (data.technologies ?? []) as string[],
    liveUrl: data.live_url,
  };
}

/* ----------------------------------------------------------- blog pages --- */

export type Post = PostSummary & {
  /** Tiptap document JSON. Rendered through an allowlist, never as HTML. */
  body: unknown;
  metaTitle: string | null;
  metaDescription: string | null;
};

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, title, slug, summary, cover_image, published_at, body, meta_title, meta_description",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(`getPostBySlug: ${error.message}`);
  if (!data?.published_at) return null;

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    coverImage: data.cover_image,
    publishedAt: data.published_at,
    body: data.body,
    metaTitle: data.meta_title,
    metaDescription: data.meta_description,
  };
}

/** One page of published posts, plus the total, for the blog index. */
export async function getPublishedPostsPage({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}): Promise<{ posts: PostSummary[]; total: number }> {
  const supabase = createStaticClient();
  const from = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from("posts")
    .select("id, title, slug, summary, cover_image, published_at", {
      count: "exact",
    })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(`getPublishedPostsPage: ${error.message}`);

  return {
    posts: (data ?? []).flatMap((row) =>
      row.published_at
        ? [
            {
              id: row.id,
              title: row.title,
              slug: row.slug,
              summary: row.summary,
              coverImage: row.cover_image,
              publishedAt: row.published_at,
            },
          ]
        : [],
    ),
    total: count ?? 0,
  };
}

/** Slugs for `generateStaticParams`, so detail pages prerender at build. */
export async function getAllPublicSlugs() {
  const supabase = createStaticClient();

  const [products, portfolio, posts] = await Promise.all([
    supabase.from("products").select("slug").eq("visible", true),
    supabase.from("portfolio_items").select("slug").eq("visible", true),
    supabase
      .from("posts")
      .select("slug, published_at")
      .eq("status", "published"),
  ]);

  return {
    products: (products.data ?? []).map((r) => r.slug),
    portfolio: (portfolio.data ?? []).map((r) => r.slug),
    posts: (posts.data ?? []).map((r) => r.slug),
  };
}
