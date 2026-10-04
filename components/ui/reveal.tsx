"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll reveal — "cards rise in one by one" (UI-UX.md 8).
 *
 * Durations follow UI-UX.md 8: scroll reveals 400-600ms with easing.
 *
 * Under `prefers-reduced-motion` the element renders plainly, with no
 * transform and no opacity animation — not a faster version of the same
 * movement. Motion sensitivity is not impatience.
 *
 * The content is always in the DOM and always visible to a crawler or a
 * screen reader; only its presentation is animated, so a reveal can never
 * hide content from someone.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Seconds. Stagger a list by passing index * 0.08 or similar. */
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      /* `once` so the page settles: re-animating on every scroll past is the
         thing that makes long pages feel restless. */
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
