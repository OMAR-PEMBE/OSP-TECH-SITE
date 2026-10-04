/* eslint-disable @next/next/no-img-element --
   These are SVGs served straight from /public/brand. next/image adds an
   optimisation pipeline that does nothing for vector art, and it cannot do the
   <picture> art-direction swap the brand rules require below 360px. Height is
   always fixed and each source declares its own intrinsic size, so neither CLS
   nor distortion is possible. */

import { cn } from "@/lib/utils/cn";

/**
 * The OSP logo, as the brand kit allows it to be used.
 *
 * The usage rules from UI-UX.md §4 live here and nowhere else: pick a
 * placement and you get the correct variant, colourway, minimum size and
 * clear space. Never recolour, distort or hand-build the wordmark
 * (agents.md §2.2).
 *
 * `header` swaps to the compact mark below a 360px viewport using <picture>,
 * so the switch costs no JavaScript, cannot flash the wrong mark during
 * hydration, and downloads only the file it actually shows.
 */
export type LogoPlacement =
  /** Horizontal, no tagline, colour. The nav bar once it frosts white. */
  | "header"
  /** Horizontal, no tagline, white. The nav bar while it is transparent over
      the navy hero — the colour logo must never sit on navy or brand blue. */
  | "header-on-dark"
  /** Primary horizontal WITH tagline, on-dark colourway. The navy footer. */
  | "footer"
  /** White colourway — brand blue or a busy photo. */
  | "on-blue"
  /** Navy colourway — stamps, one-colour print. */
  | "one-colour"
  /** Compact icon only. */
  | "mark";

type LogoAsset = {
  src: string;
  /** Intrinsic width / height, taken from the file's own viewBox. */
  ratio: number;
  alt: string;
};

const ASSETS = {
  logo: { src: "/brand/osp-logo.svg", ratio: 546.32 / 111.5, alt: "OSP Tech" },
  onDark: {
    src: "/brand/osp-logo-on-dark.svg",
    ratio: 500.08 / 111.5,
    alt: "OSP Tech — Turning Ideas Into Digital Solutions.",
  },
  white: {
    src: "/brand/osp-logo-white.svg",
    ratio: 546.32 / 111.5,
    alt: "OSP Tech",
  },
  navy: {
    src: "/brand/osp-logo-navy.svg",
    ratio: 546.32 / 111.5,
    alt: "OSP Tech",
  },
  compact: {
    src: "/brand/osp-mark-compact.svg",
    ratio: 182 / 70,
    alt: "OSP Tech",
  },
} satisfies Record<string, LogoAsset>;

const PLACEMENT: Record<LogoPlacement, LogoAsset> = {
  header: ASSETS.logo,
  "header-on-dark": ASSETS.white,
  footer: ASSETS.onDark,
  "on-blue": ASSETS.white,
  "one-colour": ASSETS.navy,
  mark: ASSETS.compact,
};

/**
 * Placements that drop to the compact mark below a 360px viewport, where the
 * horizontal lockup can no longer hold its 120px minimum width (UI-UX.md 4,
 * FR-B5). The compact mark is drawn in blue and teal only, with no navy and no
 * white, so the single file reads correctly on a light or a navy bar alike.
 */
const COMPACT_BELOW_360: ReadonlySet<LogoPlacement> = new Set([
  "header",
  "header-on-dark",
]);

/**
 * "Below 360px" as a media query.
 *
 * Not `max-width: 359px`: viewport widths are fractional on high-DPI phones,
 * so a whole-pixel bound silently fails to match anything between 359.01px and
 * 359.99px -- which is exactly where a 360px device lands once a fractional
 * device pixel ratio is involved. 359.98px covers the gap.
 */
const BELOW_360 = "(max-width: 359.98px)";

/**
 * Minimum rendered height per placement (UI-UX.md §4). Below ~32px the navy
 * bars under the icon stop reading, which is the reason the compact mark
 * exists. A caller cannot go under these.
 */
const MIN_HEIGHT: Record<LogoPlacement, number> = {
  header: 32,
  "header-on-dark": 32,
  footer: 40,
  "on-blue": 32,
  "one-colour": 32,
  mark: 24,
};

/** Brand clear space: at least the height of the navy bars, ~14% of the icon. */
const CLEAR_SPACE_RATIO = 0.14;

export type LogoProps = {
  placement?: LogoPlacement;
  /** Rendered height in px. Clamped up to the placement's brand minimum. */
  height?: number;
  /**
   * Mark the image decorative. Use when the logo sits inside a link or
   * heading that already names the company, so it is not announced twice.
   */
  decorative?: boolean;
  /** Reserve the brand clear space around the lockup. */
  clearSpace?: boolean;
  /** Above-the-fold: fetch eagerly so it never trails behind lazy discovery. */
  priority?: boolean;
  className?: string;
};

export function Logo({
  placement = "header",
  height,
  decorative = false,
  clearSpace = false,
  priority = false,
  className,
}: LogoProps) {
  const asset = PLACEMENT[placement];
  const h = Math.max(height ?? MIN_HEIGHT[placement], MIN_HEIGHT[placement]);
  const w = Math.round(h * asset.ratio);

  /* Height is pinned; width stays auto so whichever <source> the browser
     picks keeps its own aspect ratio. Nothing can be stretched. */
  const img = (
    <img
      src={asset.src}
      width={w}
      height={h}
      alt={decorative ? "" : asset.alt}
      aria-hidden={decorative || undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={cn("block w-auto max-w-full", className)}
      style={{ height: h }}
    />
  );

  return (
    <span
      className="inline-flex items-center"
      style={
        clearSpace ? { padding: Math.round(h * CLEAR_SPACE_RATIO) } : undefined
      }
    >
      {COMPACT_BELOW_360.has(placement) ? (
        <picture>
          <source
            media={BELOW_360}
            srcSet={ASSETS.compact.src}
            width={Math.round(h * ASSETS.compact.ratio)}
            height={h}
          />
          {img}
        </picture>
      ) : (
        img
      )}
    </span>
  );
}
