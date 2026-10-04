import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/card";
import { FinanceCharts } from "@/components/admin/finance-charts";
import { getFinanceSummary } from "@/lib/db/business";
import { formatTzs } from "@/lib/format";

/** Admin -> Finance -> Reports (FR-A14). */
export const metadata = { title: "Finance reports" };

export default async function FinanceReportsPage() {
  const summary = await getFinanceSummary();
  const profit = BigInt(summary.profit);

  return (
    <>
      <Link
        href="/admin/finance"
        className="text-small rounded-input text-blue-strong mb-4 inline-flex items-center gap-1.5 font-semibold"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Back to finance
      </Link>

      <PageHeader
        title="Reports"
        description="All time, with a twelve-month trend."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total income"
          value={formatTzs(BigInt(summary.incomeTotal))}
          tone="positive"
        />
        <StatCard
          label="Total expenses"
          value={formatTzs(BigInt(summary.expenseTotal))}
          tone="warning"
        />
        <StatCard
          label="Profit"
          value={formatTzs(profit)}
          tone={profit < 0n ? "negative" : "positive"}
        />
      </div>

      <div className="mt-6">
        <FinanceCharts summary={summary} />
      </div>
    </>
  );
}
