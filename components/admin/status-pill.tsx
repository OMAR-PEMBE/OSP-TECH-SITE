import { cn } from "@/lib/utils/cn";

/**
 * Status pill (UI-UX.md 7).
 *
 * Every tone carries a text label, never colour alone — colour is the second
 * signal, not the only one (WCAG 1.4.1).
 */
export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "positive" | "warning" | "danger";
}) {
  /* The tint grounds are the muted state colours at low alpha, which drags
     contrast down further than plain white does — so the text uses the
     `-text` variants, chosen to clear 4.5:1 against both the tint and white
     (see globals.css). */
  const toneClass = {
    neutral: "bg-cloud text-slate",
    info: "bg-teal/15 text-blue-strong",
    positive: "bg-success/12 text-success-text",
    warning: "bg-warning/15 text-warning-text",
    danger: "bg-danger/12 text-danger-text",
  }[tone];

  return (
    <span
      className={cn(
        "rounded-pill text-label inline-flex items-center px-2.5 py-1 uppercase",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}
