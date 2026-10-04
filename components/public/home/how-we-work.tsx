"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/public/section-heading";

/**
 * "How We Work" — four steps with a connecting line that draws blue to teal
 * as the section scrolls in (prd.md 5.2 row 5, UI-UX.md 8).
 *
 * The line is one SVG with a gradient stroke, animated by `pathLength` so it
 * genuinely draws rather than wiping a mask across. It is decorative: the
 * steps are an ordered list and read correctly with the line absent, which is
 * exactly what happens under reduced motion and with JavaScript off.
 *
 * The gradient uses the brand tokens via `currentColor`-free stops that point
 * at the CSS variables, so no hex appears here.
 */

const STEPS = [
  {
    title: "Talk to us",
    body: "A short WhatsApp conversation about what your business actually needs.",
  },
  {
    title: "Plan & design",
    body: "We agree the scope, the look and a fixed price before any code is written.",
  },
  {
    title: "Build & test",
    body: "You see it as it comes together, on your own phone, not at the end.",
  },
  {
    title: "Launch & support",
    body: "We put it live and stay reachable — the same number you started on.",
  },
];

export function HowWeWork() {
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduced = useReducedMotion();

  return (
    <Section ground="white" className="py-20 sm:py-28">
      <SectionHeading
        label="How we work"
        title="Four steps, no surprises."
        lead="You always know what happens next, and what it costs."
      />

      <div className="relative mt-14">
        {/* The connecting line. Hidden below lg, where the steps stack and a
            horizontal line would be meaningless. */}
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 1000 2"
          preserveAspectRatio="none"
          className="absolute top-6 right-0 left-0 hidden h-0.5 lg:block"
        >
          <defs>
            <linearGradient id="osp-how-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-blue)" />
              <stop offset="100%" stopColor="var(--color-teal)" />
            </linearGradient>
          </defs>
          <motion.line
            x1="0"
            y1="1"
            x2="1000"
            y2="1"
            stroke="url(#osp-how-line)"
            strokeWidth="2"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={inView || reduced ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </svg>

        <ol
          ref={ref}
          className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <span
                className="bg-blue-strong text-label flex size-12 items-center justify-center rounded-full text-white"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <h3 className="text-h3 text-navy mt-5 font-semibold">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="text-small text-slate mt-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
