import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ExpenseForm } from "@/components/admin/expense-form";
import { listExpenseCategories, listExpenses } from "@/lib/db/business";

export const metadata = { title: "Edit expense" };

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entries, categories] = await Promise.all([
    listExpenses(),
    listExpenseCategories(),
  ]);
  const entry = entries.find((e) => e.id === id);
  if (!entry) notFound();

  return (
    <>
      <PageHeader title="Edit expense" />
      <ExpenseForm entry={entry} categories={categories} />
    </>
  );
}
