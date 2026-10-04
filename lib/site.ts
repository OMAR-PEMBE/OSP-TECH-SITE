/**
 * Site-level constants for SEO and canonical URLs (architecture.md 12).
 *
 * The origin comes from an env var so preview deploys produce their own
 * absolute URLs rather than pointing OG tags and sitemap entries at
 * production.
 */

export const SITE_NAME = "OSP Tech";

export const SITE_DESCRIPTION =
  "OSP Tech builds business systems, websites and automation for Tanzanian businesses. Based in Morogoro, a WhatsApp message away.";

/**
 * Absolute site origin, without a trailing slash.
 *
 * Falls back to localhost so a developer without the var set still gets
 * working absolute URLs instead of `undefined/og.png` in a meta tag.
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Default social share image: the primary horizontal logo with tagline on
 * white, per the brand rules (UI-UX.md 4) — the kit already ships it at the
 * right size.
 */
export const OG_IMAGE = {
  url: "/brand/og-default.png",
  width: 1200,
  height: 630,
  alt: "OSP Tech — Turning Ideas Into Digital Solutions.",
};
