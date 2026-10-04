import { Slash } from "@/components/ui/slash";

/* eslint-disable @next/next/no-img-element --
   Decorative vector art from /public/brand; see components/ui/logo.tsx. */

/**
 * Tier 1 of 3: the static hero backdrop.
 *
 * Server-rendered and always present, so the navy ground, the glow, the faint
 * oversized mark and the single 60 degree slash all paint with the document.
 * The richer tiers build on this one rather than replacing it -- which is what
 * makes "content before 3D" true rather than aspirational. With JavaScript
 * off, or on the slowest phone on the slowest connection, this is the hero and
 * it is complete.
 *
 * There is exactly one of these in the layout, so there is exactly one slash
 * (UI-UX.md 5). Tier 2 animates this same markup through the
 * `[data-hero-tier="light"]` rules in globals.css, so nothing is duplicated.
 */
export function HeroBackdrop() {
  return (
    <div className="absolute inset-0 -z-10 overflow-clip" aria-hidden="true">
      {/* Blue + teal glow over the navy ground. */}
      <div className="hero-glow absolute inset-0" />

      {/* "A very faint oversized navy icon may sit behind content for depth"
          (UI-UX.md 5). White at 4% over navy reads as navy a shade lighter,
          which is the effect that line describes. */}
      <img
        src="/brand/osp-mark-white.svg"
        alt=""
        aria-hidden="true"
        width={184}
        height={104}
        decoding="async"
        loading="lazy"
        className="absolute -top-[12%] -right-[16%] w-[min(620px,76vw)] opacity-[0.04]"
      />

      {/* The one 60 degree slash for this layout, bleeding off the bottom edge
          and clipped by the section. */}
      <Slash
        bars={3}
        className="hero-slash absolute -bottom-[8%] -left-[12%] h-[38%] w-[42%] opacity-50"
      />
    </div>
  );
}
