import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/site";

/**
 * robots.txt (FR-W10).
 *
 * `/admin` and `/login` are disallowed. That is a politeness signal to
 * well-behaved crawlers, never a security control — the actual protection is
 * the server-side session check plus RLS (security.md 3). Nothing private is
 * reachable by ignoring this file.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/login", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
