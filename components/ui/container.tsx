import { cn } from "@/lib/utils/cn";

/**
 * Content measure: max 1200px with 16px side gutters on mobile
 * (UI-UX.md §6). Every section's content goes through this so nothing can
 * cause horizontal scroll at 360px.
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "max-w-content mx-auto w-full px-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
