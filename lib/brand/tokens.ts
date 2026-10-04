/**
 * Non-CSS brand constants.
 *
 * `app/globals.css` is the single source of truth for brand colour
 * (agents.md §2.1). Two consumers cannot read a CSS custom property:
 *
 *  1. HTML `<meta name="theme-color">` — emitted by Next's `viewport` export
 *     from a server component, where no DOM exists.
 *  2. The `site.webmanifest` PWA theme/background colours.
 *
 * This file is therefore the ONLY permitted mirror of a brand hex outside
 * globals.css, and it mirrors exactly two values. Everything that renders —
 * including the Three.js hero materials — reads the live CSS variables via
 * `readBrandColors()` instead, so there is nothing else to keep in sync.
 */

/** Mirrors `--color-blue` in app/globals.css and `theme_color` in the manifest. */
export const THEME_COLOR = "#3871FC";

/** Mirrors `--color-white` and `background_color` in the manifest. */
export const BACKGROUND_COLOR = "#FFFFFF";

/**
 * The palette as literal hex, for the few places a CSS variable cannot reach.
 *
 * `app/globals.css` remains the source of truth for everything that renders in
 * the app. These values exist because three contexts are not the app:
 *
 *  - **Email HTML** (`/api/cron/reminders`). Email clients do not support CSS
 *    custom properties; Outlook strips them entirely.
 *  - **The printable finance report** (`/api/finance/export`). A standalone
 *    document served outside the app's stylesheet.
 *  - **Chart SSR fallbacks**. `getComputedStyle` needs a DOM, so the first
 *    server render has nothing to read; the charts re-read the live tokens on
 *    the client and these are only the pre-hydration values.
 *
 * Keeping them in one file means a palette change is two edits, in two files
 * that reference each other, rather than a hunt through routes.
 */
export const BRAND_HEX = {
  blue: "#3871FC",
  blueStrong: "#2457D6",
  teal: "#04BCC8",
  navy: "#081B33",
  cloud: "#F3F6FB",
  slate: "#5B6576",
  white: "#FFFFFF",
  success: "#1CA05C",
  warning: "#E3A008",
  danger: "#E5484D",
  border: "#E3E8F0",
} as const;

/** Brand colour tokens, by the name they carry in app/globals.css. */
export const BRAND_TOKENS = [
  "blue",
  "blue-strong",
  "teal",
  "navy",
  "cloud",
  "slate",
  "white",
] as const;

export type BrandToken = (typeof BRAND_TOKENS)[number];

export type BrandColors = Record<BrandToken, string>;

/**
 * Reads the brand palette out of the live stylesheet.
 *
 * Client-only. Used by the 3D hero so Three.js materials are driven by the
 * same `--color-*` tokens as the rest of the UI — change globals.css and the
 * scene follows, with no hex duplicated into JS.
 */
export function readBrandColors(): BrandColors {
  const styles = getComputedStyle(document.documentElement);
  const read = (token: BrandToken) =>
    styles.getPropertyValue(`--color-${token}`).trim();

  return BRAND_TOKENS.reduce((acc, token) => {
    acc[token] = read(token);
    return acc;
  }, {} as BrandColors);
}
