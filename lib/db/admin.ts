import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Admin reads (API.md 4).
 *
 * Separate from `lib/db/queries` because these run as the signed-in owner and
 * deliberately see everything — hidden services, draft posts, contact
 * messages. The public queries use an anonymous client that could not read
 * these rows even if asked.
 *
 * Nothing here re-checks the role. The session client carries the owner's
 * JWT, so RLS evaluates `is_owner()` on every statement; a non-owner calling
 * these gets empty results from the database itself.
 */

export type AdminService = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  shortDesc: string | null;
  fullDesc: string | null;
  whatsappMessage: string | null;
  sortOrder: number;
  visible: boolean;
};

export async function listServices(): Promise<AdminService[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`listServices: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    icon: r.icon,
    shortDesc: r.short_desc,
    fullDesc: r.full_desc,
    whatsappMessage: r.whatsapp_message,
    sortOrder: r.sort_order,
    visible: r.visible,
  }));
}

export async function getService(id: string): Promise<AdminService | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    icon: data.icon,
    shortDesc: data.short_desc,
    fullDesc: data.full_desc,
    whatsappMessage: data.whatsapp_message,
    sortOrder: data.sort_order,
    visible: data.visible,
  };
}

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  features: string[];
  images: string[];
  pricingText: string | null;
  badge: "none" | "coming_soon" | "new" | "popular";
  whatsappMessage: string | null;
  sortOrder: number;
  visible: boolean;
};

export async function listProducts(): Promise<AdminProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`listProducts: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    features: (r.features ?? []) as string[],
    images: (r.images ?? []) as string[],
    pricingText: r.pricing_text,
    badge: r.badge,
    whatsappMessage: r.whatsapp_message,
    sortOrder: r.sort_order,
    visible: r.visible,
  }));
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    features: (data.features ?? []) as string[],
    images: (data.images ?? []) as string[],
    pricingText: data.pricing_text,
    badge: data.badge,
    whatsappMessage: data.whatsapp_message,
    sortOrder: data.sort_order,
    visible: data.visible,
  };
}

export type AdminPortfolioItem = {
  id: string;
  title: string;
  slug: string;
  type: string | null;
  description: string | null;
  images: string[];
  technologies: string[];
  liveUrl: string | null;
  sortOrder: number;
  visible: boolean;
};

export async function listPortfolio(): Promise<AdminPortfolioItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`listPortfolio: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    type: r.type,
    description: r.description,
    images: (r.images ?? []) as string[],
    technologies: (r.technologies ?? []) as string[],
    liveUrl: r.live_url,
    sortOrder: r.sort_order,
    visible: r.visible,
  }));
}

export async function getPortfolioItem(
  id: string,
): Promise<AdminPortfolioItem | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

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
    sortOrder: data.sort_order,
    visible: data.visible,
  };
}

export type AdminPost = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  body: unknown;
  status: "draft" | "published";
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
};

export async function listPosts(): Promise<AdminPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`listPosts: ${error.message}`);

  return (data ?? []).map(mapPost);
}

export async function getPost(id: string): Promise<AdminPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data ? mapPost(data) : null;
}

function mapPost(r: {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image: string | null;
  body: unknown;
  status: "draft" | "published";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
}): AdminPost {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    summary: r.summary,
    coverImage: r.cover_image,
    body: r.body,
    status: r.status,
    publishedAt: r.published_at,
    metaTitle: r.meta_title,
    metaDescription: r.meta_description,
    updatedAt: r.updated_at,
  };
}

export type AdminMessage = {
  id: string;
  name: string;
  phone: string | null;
  need: string | null;
  message: string;
  status: "new" | "replied" | "closed";
  sourcePage: string | null;
  createdAt: string;
};

export async function listMessages({
  status,
}: { status?: "new" | "replied" | "closed" } = {}): Promise<AdminMessage[]> {
  const supabase = await createClient();

  let query = supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(`listMessages: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    need: r.need,
    message: r.message,
    status: r.status,
    sourcePage: r.source_page,
    createdAt: r.created_at,
  }));
}

export async function countNewMessages(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  return count ?? 0;
}

export type AdminSettings = {
  companyName: string;
  tagline: string;
  whatsappNumber: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  socials: Record<string, string>;
  trustStats: { label: string; value: number | null; suffix?: string }[];
  defaultWhatsappGreeting: string | null;
};

export async function getSettings(): Promise<AdminSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (!data) return null;

  return {
    companyName: data.company_name,
    tagline: data.tagline,
    whatsappNumber: data.whatsapp_number,
    phone: data.phone,
    email: data.email,
    location: data.location,
    socials: (data.socials ?? {}) as Record<string, string>,
    trustStats: (data.trust_stats ?? []) as AdminSettings["trustStats"],
    defaultWhatsappGreeting: data.default_whatsapp_greeting,
  };
}
