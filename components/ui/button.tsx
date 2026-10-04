import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Branded button (UI-UX.md §7).
 *
 * - `primary`   blue fill, white text, 14px radius.
 * - `secondary` navy outline on white.
 * - `on-navy`   white outline, for use inside a navy section.
 * - `whatsapp`  WhatsApp green — a functional affordance, not a brand colour,
 *               and only ever used for WhatsApp actions.
 *
 * Hover gives a slight lift plus a teal accent line, per §7. Label text is
 * SemiBold; it never uses brand blue on white, because below 24px that is
 * only 4.25:1 — blue-strong is used instead (FR-B3).
 */

const BASE = [
  "group relative inline-flex items-center justify-center gap-2",
  "rounded-card px-6 py-3 text-body font-semibold",
  "transition-[transform,background-color,color,box-shadow] duration-200",
  "hover:-translate-y-0.5 active:translate-y-0",
  "disabled:pointer-events-none disabled:opacity-50",
  /* The hover accent line: a teal rule under the label. */
  "after:absolute after:inset-x-6 after:bottom-1.5 after:h-0.5 after:origin-left",
  "after:scale-x-0 after:bg-teal after:transition-transform after:duration-200",
  "hover:after:scale-x-100 focus-visible:after:scale-x-100",
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
].join(" ");

/**
 * Primary fills with Blue-Strong, not Blue.
 *
 * UI-UX.md 7 describes the primary button as "blue fill, white text", but
 * white on #3871FC is 4.25:1 — the same ratio 2.3 already rules out for text
 * under 24px, since contrast is symmetric. At the button's 16px that is below
 * the 4.5:1 AA floor, and AA is non-negotiable (agents.md 2.7, NFR-4).
 * #2457D6 carries white at about 6.3:1 and is an existing brand token, so the
 * fix needs no new colour: the same reasoning 2.3 applies to blue *text* on
 * white, applied to white text on blue.
 *
 * Hover therefore keeps the fill and leans on the lift plus the teal accent
 * line that 7 also calls for, rather than shifting to a lighter blue that
 * would fail the same check.
 *
 * Flagged for a UI-UX.md amendment — see the Phase 0 handover notes.
 */
const VARIANT = {
  primary: "bg-blue-strong text-white shadow-soft",
  secondary: "border-2 border-navy bg-transparent text-blue-strong",
  "on-navy": "border-2 border-white bg-transparent text-white",
  whatsapp: "bg-whatsapp text-navy shadow-soft",
} as const;

const SIZE = {
  md: "min-h-[48px]",
  /* 44px is the minimum comfortable tap target; md is the default because
     this site is used almost entirely on phones. */
  sm: "min-h-[44px] px-4 py-2 text-small",
} as const;

export type ButtonVariant = keyof typeof VARIANT;

type CommonProps = {
  variant?: ButtonVariant;
  size?: keyof typeof SIZE;
  className?: string;
  children: React.ReactNode;
};

export type ButtonProps = CommonProps &
  Omit<React.ComponentPropsWithoutRef<"button">, "className" | "children">;

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANT[variant], SIZE[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export type ButtonLinkProps = CommonProps &
  Omit<React.ComponentPropsWithoutRef<"a">, "className" | "children">;

/** Same brand treatment as <Button>, for navigation rather than an action. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={cn(BASE, VARIANT[variant], SIZE[size], className)} {...props}>
      {children}
    </a>
  );
}
