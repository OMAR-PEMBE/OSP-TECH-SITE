import { cn } from "@/lib/utils/cn";

/** White panel on the Cloud admin ground. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-border rounded-card border bg-white p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Stat tile (UI-UX.md 7): caps label, big navy number, small trend. */
export function StatCard({
  label,
  value,
  trend,
  tone = "neutral",
}: {
  label: string;
  value: string;
  trend?: string;
  tone?: "neutral" | "positive" | "negative" | "warning";
}) {
  const toneClass = {
    /* The -text variants: these are 14px on white, where the muted
       state colours fall below AA (see globals.css). */
    neutral: "text-slate",
    positive: "text-success-text",
    negative: "text-danger-text",
    warning: "text-warning-text",
  }[tone];

  return (
    <Card>
      <p className="text-label text-slate uppercase">{label}</p>
      <p className="text-h1 text-navy mt-2 font-bold tabular-nums">{value}</p>
      {trend && <p className={cn("text-small mt-1", toneClass)}>{trend}</p>}
    </Card>
  );
}
