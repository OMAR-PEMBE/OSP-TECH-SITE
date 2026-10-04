import { PAYMENT_METHOD_LABELS } from "@/lib/validation/business";
import type { ExpenseCategory } from "@/lib/db/business";

/**
 * Finance filters (FR-A14).
 *
 * A plain GET form, so a filtered view is a shareable URL, survives a
 * refresh, and needs no JavaScript. The server narrows every value before it
 * reaches a query.
 */
export function FinanceFilters({
  categories,
  projects,
  current,
}: {
  categories: ExpenseCategory[];
  projects: { id: string; name: string }[];
  current: Record<string, string | undefined>;
}) {
  const field =
    "rounded-input border-border text-small text-navy w-full border bg-white px-3 py-2.5";

  return (
    <form
      method="get"
      className="border-border rounded-card grid gap-3 border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <label className="text-small text-navy font-semibold">
        From
        <input
          type="date"
          name="from"
          defaultValue={current.from ?? ""}
          className={`${field} mt-1.5`}
        />
      </label>

      <label className="text-small text-navy font-semibold">
        To
        <input
          type="date"
          name="to"
          defaultValue={current.to ?? ""}
          className={`${field} mt-1.5`}
        />
      </label>

      <label className="text-small text-navy font-semibold">
        Project
        <select
          name="projectId"
          defaultValue={current.projectId ?? ""}
          className={`${field} mt-1.5`}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-small text-navy font-semibold">
        Category
        <select
          name="categoryId"
          defaultValue={current.categoryId ?? ""}
          className={`${field} mt-1.5`}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-small text-navy font-semibold">
        Method
        <select
          name="method"
          defaultValue={current.method ?? ""}
          className={`${field} mt-1.5`}
        >
          <option value="">All methods</option>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
        <button
          type="submit"
          className="rounded-input bg-blue-strong text-small min-h-[44px] px-4 font-semibold text-white"
        >
          Apply filters
        </button>
        <a
          href="/admin/finance"
          className="rounded-input text-small text-navy hover:bg-cloud inline-flex min-h-[44px] items-center px-4 font-semibold"
        >
          Clear
        </a>
      </div>
    </form>
  );
}
