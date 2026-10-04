import { cn } from "@/lib/utils/cn";

/** Standard admin page heading, so every screen starts the same way. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div>
        <h1 className="text-h1 text-navy font-bold">{title}</h1>
        {description && (
          <p className="text-small text-slate mt-1.5">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
