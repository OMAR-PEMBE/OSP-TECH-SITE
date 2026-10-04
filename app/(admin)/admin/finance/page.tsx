import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, StatCard } from "@/components/admin/card";
import { EmptyState } from "@/components/admin/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { FinanceFilters } from "@/components/admin/finance-filters";
import { FinanceRowActions } from "@/components/admin/finance-row-actions";
import {
  getFinanceSummary,
  listExpenseCategories,
  listExpenses,
  listIncome,
  listProjects,
  toPaymentMethod,
} from "@/lib/db/business";
import { deleteExpense, deleteIncome } from "@/app/actions/business";
import { formatDateShort, formatTzs } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/validation/business";

/** Admin → Finance (FR-A12, FR-A13, FR-A14). */
export const metadata = { title: "Finance" };

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    projectId?: string;
    categoryId?: string;
    method?: string;
  }>;
}) {
  const params = await searchParams;

  /* Only well-formed dates reach the query; anything else is ignored rather
     than passed through to Postgres. */
  const isDate = (v?: string) =>
    v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;

  const filters = {
    from: isDate(params.from),
    to: isDate(params.to),
    projectId: params.projectId || undefined,
    categoryId: params.categoryId || undefined,
    method: toPaymentMethod(params.method),
  };

  const [summary, income, expenses, categories, projects] = await Promise.all([
    getFinanceSummary(filters),
    listIncome(filters),
    listExpenses(filters),
    listExpenseCategories(),
    listProjects({ includeArchived: true }),
  ]);

  const profit = BigInt(summary.profit);

  const exportQuery = new URLSearchParams(
    Object.entries(params).filter(([, v]) => Boolean(v)) as [string, string][],
  ).toString();

  return (
    <>
      <PageHeader
        title="Finance"
        description="Money in, money out, and what is left."
        actions={
          <>
            <ButtonLink href="/admin/finance/income/new" size="sm">
              <Plus aria-hidden className="size-4" />
              Income
            </ButtonLink>
            <ButtonLink
              href="/admin/finance/expenses/new"
              size="sm"
              variant="secondary"
            >
              <Plus aria-hidden className="size-4" />
              Expense
            </ButtonLink>
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Income"
          value={formatTzs(BigInt(summary.incomeTotal))}
          trend={`${income.length} entr${income.length === 1 ? "y" : "ies"}`}
          tone="positive"
        />
        <StatCard
          label="Expenses"
          value={formatTzs(BigInt(summary.expenseTotal))}
          trend={`${expenses.length} entr${expenses.length === 1 ? "y" : "ies"}`}
          tone="warning"
        />
        <StatCard
          label="Profit"
          value={formatTzs(profit)}
          trend={profit < 0n ? "Running at a loss" : "In the black"}
          tone={profit < 0n ? "negative" : "positive"}
        />
      </div>

      <div className="mt-6">
        <FinanceFilters
          categories={categories}
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          current={params}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/admin/finance/reports"
          className="text-small rounded-input text-blue-strong inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
        >
          Charts and monthly report
          <ArrowRight aria-hidden className="size-4" />
        </Link>
        <a
          href={`/api/finance/export?format=csv${exportQuery ? `&${exportQuery}` : ""}`}
          className="text-small rounded-input text-blue-strong font-semibold underline-offset-4 hover:underline"
        >
          Download CSV
        </a>
        <a
          href={`/api/finance/export?format=pdf${exportQuery ? `&${exportQuery}` : ""}`}
          className="text-small rounded-input text-blue-strong font-semibold underline-offset-4 hover:underline"
        >
          Download PDF
        </a>
      </div>

      <section className="mt-8">
        <h2 className="text-h2 text-navy font-bold">Income</h2>
        <div className="mt-3">
          {income.length === 0 ? (
            <EmptyState
              title="No income recorded"
              description="Record a payment to see it here and against its project."
            />
          ) : (
            <Card className="overflow-x-auto p-0 sm:p-0">
              <table className="w-full min-w-[40rem] text-left">
                <thead className="bg-cloud">
                  <tr>
                    <Th>Date</Th>
                    <Th>Amount</Th>
                    <Th>From</Th>
                    <Th>Method</Th>
                    <Th>Reference</Th>
                    <Th>
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {income.map((entry) => (
                    <tr key={entry.id}>
                      <Td>{formatDateShort(entry.date)}</Td>
                      <Td className="text-navy font-semibold tabular-nums">
                        {formatTzs(BigInt(entry.amount))}
                      </Td>
                      <Td>{entry.projectName ?? entry.clientName ?? "—"}</Td>
                      <Td>
                        {
                          PAYMENT_METHOD_LABELS[
                            entry.method as keyof typeof PAYMENT_METHOD_LABELS
                          ]
                        }
                      </Td>
                      <Td className="text-slate">{entry.reference ?? "—"}</Td>
                      <Td>
                        <FinanceRowActions
                          editHref={`/admin/finance/income/${entry.id}`}
                          onDelete={deleteIncome.bind(null, entry.id)}
                          label="income entry"
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-navy font-bold">Expenses</h2>
        <div className="mt-3">
          {expenses.length === 0 ? (
            <EmptyState
              title="No expenses recorded"
              description="Record what the business spends to see real profit."
            />
          ) : (
            <Card className="overflow-x-auto p-0 sm:p-0">
              <table className="w-full min-w-[40rem] text-left">
                <thead className="bg-cloud">
                  <tr>
                    <Th>Date</Th>
                    <Th>Amount</Th>
                    <Th>Category</Th>
                    <Th>Method</Th>
                    <Th>Description</Th>
                    <Th>
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {expenses.map((entry) => (
                    <tr key={entry.id}>
                      <Td>{formatDateShort(entry.date)}</Td>
                      <Td className="text-navy font-semibold tabular-nums">
                        {formatTzs(BigInt(entry.amount))}
                      </Td>
                      <Td>{entry.categoryName ?? "Uncategorised"}</Td>
                      <Td>
                        {
                          PAYMENT_METHOD_LABELS[
                            entry.method as keyof typeof PAYMENT_METHOD_LABELS
                          ]
                        }
                      </Td>
                      <Td className="text-slate">{entry.description ?? "—"}</Td>
                      <Td>
                        <FinanceRowActions
                          editHref={`/admin/finance/expenses/${entry.id}`}
                          onDelete={deleteExpense.bind(null, entry.id)}
                          label="expense"
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="text-label text-slate px-4 py-3 uppercase">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`text-small text-navy px-4 py-3 ${className}`}>
      {children}
    </td>
  );
}
