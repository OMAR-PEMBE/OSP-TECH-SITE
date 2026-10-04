import type { MetadataRoute } from "next";
import { getAllPublicSlugs } from "@/lib/db/queries";
import { absoluteUrl } from "@/lib/site";

/**
 * sitemap.xml, generated from published content (FR-W10, API.md 5).
 *
 * Next serves this at /sitemap.xml. Only rows the anon role can read reach
 * it, so an unpublished post cannot be advertised to a crawler by accident —
 * the same RLS boundary that protects the pages protects the sitemap.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, portfolio, posts } = await getAllPublicSlugs();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/services"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];

  return [
    ...staticRoutes,
    ...products.map((slug) => ({
      url: absoluteUrl(`/products/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...portfolio.map((slug) => ({
      url: absoluteUrl(`/portfolio/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...posts.map((slug) => ({
      url: absoluteUrl(`/blog/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
