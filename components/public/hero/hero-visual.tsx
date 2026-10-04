"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useHeroTier } from "@/lib/hooks/use-hero-tier";
import { useRenderActive } from "@/lib/hooks/use-render-active";

/**
 * Chooses the hero treatment and mounts the 3D scene when it is warranted.
 *
 * This is the only client component in the hero and it is deliberately tiny: a
 * tier decision, one attribute write, and a ref. The Three.js scene comes in
 * through `next/dynamic` with `ssr: false`, so three.js, drei and the scene sit
 * in a chunk that is requested only when `tier === "full"` -- after first
 * paint, on a device that passed the capability check (agents.md 2.8,
 * architecture.md 8.1). `ssr: false` must be declared from a client component
 * in the App Router, which is why this file exists at all rather than the
 * import living in the server hero.
 *
 * Tiers 1 and 2 add no DOM. They set `data-hero-tier` on the hero section and
 * let the CSS in globals.css animate the backdrop that the server already
 * rendered, so the layout keeps exactly one 60 degree slash and there is
 * nothing to flash or reconcile on hydration.
 */
const HeroScene = dynamic(() => import("@/components/public/hero/hero-scene"), {
  ssr: false,
});

export function HeroVisual() {
  const tier = useHeroTier();
  const frameRef = useRef<HTMLDivElement>(null);

  /* Hooks cannot be conditional, so this runs on every tier. It is two
     observers and costs nothing while no scene is mounted. */
  const active = useRenderActive(frameRef);

  useEffect(() => {
    const root = frameRef.current?.closest<HTMLElement>("[data-hero-root]");
    if (root) root.dataset.heroTier = tier;
  }, [tier]);

  return (
    <div
      ref={frameRef}
      className="pointer-events-none absolute inset-0 -z-10"
      aria-hidden="true"
    >
      {tier === "full" && <HeroScene active={active} />}
    </div>
  );
}
