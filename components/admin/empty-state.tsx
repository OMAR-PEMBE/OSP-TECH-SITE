import { Card } from "@/components/admin/card";

/**
 * Empty state (UI-UX.md 11: "plain and helpful").
 *
 * Says what is missing and what to do about it, rather than just reporting
 * that a list is empty.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="text-center">
      <p className="text-h3 text-navy font-semibold">{title}</p>
      {description && (
        <p className="text-small text-slate mx-auto mt-2 max-w-[32rem]">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  );
}
