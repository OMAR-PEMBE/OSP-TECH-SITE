"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True only while `ref` is on screen and the tab is visible.
 *
 * The 3D hero uses this to stop rendering entirely when it scrolls away or
 * the visitor switches tabs — the budget rule in architecture.md §8.4. On a
 * mid-range Android this is the difference between a warm phone and a hot one.
 */
export function useRenderActive(ref: RefObject<Element | null>): boolean {
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      /* A little margin so the scene is already running by the time it is
         actually visible when scrolling back up. */
      { rootMargin: "120px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  useEffect(() => {
    const onVisibility = () =>
      setTabVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return onScreen && tabVisible;
}
