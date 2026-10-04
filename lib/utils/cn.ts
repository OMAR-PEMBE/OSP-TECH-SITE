import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Tailwind class merger, taught the OSP theme.
 *
 * This has to be extended rather than used off the shelf. `tailwind-merge`
 * resolves conflicts from a built-in map of Tailwind's default scales, and our
 * tokens are not on it — so it guesses, and it guesses wrong in a way that is
 * invisible until something is the wrong colour.
 *
 * The failure that prompted this: `cn("bg-whatsapp text-navy ... text-body")`
 * returned the list *without* `text-navy`. Both `text-navy` (a colour) and
 * `text-body` (a size) look like `text-*`, so they were treated as the same
 * conflict group and the later one won. The button rendered white-on-green at
 * 1.98:1 — a real WCAG failure, from a utility silently dropping a class.
 *
 * Declaring the token lists explicitly tells the merger that a size and a
 * colour are different axes, so both survive. Every custom scale in
 * globals.css is listed here; adding a token there means adding it here too,
 * which is the cost of having a theme the merger cannot introspect.
 */

const COLORS = [
  "blue",
  "blue-strong",
  "teal",
  "navy",
  "cloud",
  "slate",
  "white",
  "success",
  "success-text",
  "warning",
  "warning-text",
  "danger",
  "danger-text",
  "border",
  "whatsapp",
  "transparent",
  "current",
];

const FONT_SIZES = [
  "display-xl",
  "display-l",
  "h1",
  "h2",
  "h3",
  "body-lg",
  "body",
  "small",
  "label",
];

const RADII = ["card", "input", "pill"];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZES }],
      "text-color": [{ text: COLORS }],
      "bg-color": [{ bg: COLORS }],
      "border-color": [{ border: COLORS }],
      "border-w": [{ border: ["0", "2", "4", "8"] }],
      "ring-color": [{ ring: COLORS }],
      "outline-color": [{ outline: COLORS }],
      rounded: [{ rounded: RADII }],
      "font-weight": [{ font: ["body", "semibold", "bold", "display"] }],
      shadow: [{ shadow: ["soft"] }],
      "max-w": [{ "max-w": ["content"] }],
    },
  },
});

/** Merge Tailwind class lists, letting later classes win over earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
