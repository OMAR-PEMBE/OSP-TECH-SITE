"use client";

import { useEffect, useState } from "react";

/**
 * Which hero treatment this visitor gets (architecture.md §8.2–8.3).
 *
 *  - `static` — navy gradient only. Reduced motion, oldest devices, and the
 *    value every visitor starts on so first paint never waits on a decision.
 *  - `light`  — animated CSS gradient + drifting 60° slash. Low memory,
 *    slow connection, or Data Saver on.
 *  - `full`   — the Three.js scene: rotating OSP mark + blue/teal node network.
 */
export type HeroTier = "static" | "light" | "full";

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
};

type CapabilityNavigator = Navigator & {
  deviceMemory?: number;
  connection?: NetworkInformation;
};

const SLOW_CONNECTIONS = new Set(["slow-2g", "2g", "3g"]);

/** Minimum device memory (GiB) we will start a WebGL scene on. */
const MIN_DEVICE_MEMORY = 4;

function detectTier(): HeroTier {
  /* Preference wins over capability, always. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "static";
  }

  const nav = navigator as CapabilityNavigator;

  /* `deviceMemory` is Chromium-only and the audience is largely Android
     Chrome, which is exactly where it matters. Where it is missing we fall
     through to the connection check rather than assuming the device is fast. */
  if (
    typeof nav.deviceMemory === "number" &&
    nav.deviceMemory < MIN_DEVICE_MEMORY
  ) {
    return "light";
  }

  const connection = nav.connection;
  if (connection?.saveData) return "light";
  if (
    connection?.effectiveType &&
    SLOW_CONNECTIONS.has(connection.effectiveType)
  ) {
    return "light";
  }

  /* No WebGL, no scene. Cheap feature test — no context is kept. */
  if (!hasWebGl()) return "light";

  return "full";
}

function hasWebGl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function useHeroTier(): HeroTier {
  /* Start static: the server-rendered hero is already on screen and we must
     not push anything heavier in front of LCP. */
  const [tier, setTier] = useState<HeroTier>("static");

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let cancelled = false;

    const resolve = () => {
      if (!cancelled) setTier(detectTier());
    };

    /* Upgrade only once the main thread is free, so the decision — and the
       Three.js download it may trigger — happens strictly after first paint.
       requestIdleCallback is unavailable on Safari, hence the timeout. */
    const canIdle = typeof window.requestIdleCallback === "function";
    const idleHandle: number = canIdle
      ? window.requestIdleCallback(resolve, { timeout: 2500 })
      : window.setTimeout(resolve, 1200);

    /* Someone turning reduced motion on mid-visit drops straight to static. */
    const onMotionChange = () => resolve();
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      cancelled = true;
      motionQuery.removeEventListener("change", onMotionChange);
      if (canIdle) {
        window.cancelIdleCallback(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
    };
  }, []);

  return tier;
}
