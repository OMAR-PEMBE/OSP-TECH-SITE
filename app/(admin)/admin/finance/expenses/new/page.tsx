import { PageHeader } from "@/components/admin/page-header";
import { ExpenseForm } from "@/components/admin/expense-form";
import { listExpenseCategories } from "@/lib/db/business";

export const metadata = { title: "Record expense" };

export default async function NewExpensePage() {
  const categories = await listExpenseCategories();
  return (
    <>
      <PageHeader title="Record expense" />
      <ExpenseForm categories={categories} />
    </>
  );
}
