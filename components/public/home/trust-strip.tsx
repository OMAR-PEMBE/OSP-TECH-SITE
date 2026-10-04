"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Section } from "@/components/ui/section";
import type { TrustStat } from "@/lib/db/queries";

/**
 * Trust strip — "numbers count up when in view" (prd.md 5.2 row 2).
 *
 * The final value is rendered server-side in the markup and the count-up only
 * replaces it once the strip scrolls into view, so a crawler, a reader with
 * JavaScript off, and anyone with reduced motion all see the real number
 * immediately. The animation is decoration layered on top of a correct page,
 * never the thing that produces the content.
 *
 * `aria-hidden` is not used: the text content is the final value from the very
 * first frame for assistive tech, because the animated element carries
 * `aria-label` with the settled figure.
 */

const DURATION_MS = 1400;

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const start = performance.now();
        let frame = 0;

        const tick = (now: number) => {
          const t = Math.min((now - start) / DURATION_MS, 1);
          /* Ease-out cubic: fast at first, settling onto the real number. */
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(value * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };

        /* Only now drop to zero — so the correct number was on screen up to
           the moment the animation actually begins. */
        setDisplay(0);
        frame = requestAnimationFrame(tick);
        observer.disconnect();

        return () => cancelAnimationFrame(frame);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, reduced]);

  /* The settled value is exposed as real text, not as `aria-label`.
     `aria-label` is prohibited on a span with no role — assistive tech is free
     to ignore it, and axe flags it. A visually-hidden span carrying the true
     figure always reads correctly, whatever the animation is mid-way through. */
  return (
    <span ref={ref}>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      <span aria-hidden="true">
        {display}
        {suffix}
      </span>
    </span>
  );
}

export function TrustStrip({ stats }: { stats: TrustStat[] }) {
  if (stats.length === 0) return null;

  return (
    <Section ground="cloud" className="py-12 sm:py-16">
      <h2 className="sr-only">OSP Tech by the numbers</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {stats.map((stat) => (
          /* dt before dd is required inside a <dl> <div> — reversed visually
             with flex-col-reverse so the number still reads first, while a
             screen reader gets "Projects delivered, 15+" in that order. */
          <div
            key={stat.label}
            className="flex flex-col-reverse items-center text-center"
          >
            <dt className="text-label text-slate mt-2 uppercase">
              {stat.label}
            </dt>
            <dd className="text-display-l font-display text-blue-strong italic">
              {stat.value === null ? (
                (stat.suffix ?? "")
              ) : (
                <CountUp value={stat.value} suffix={stat.suffix ?? ""} />
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
