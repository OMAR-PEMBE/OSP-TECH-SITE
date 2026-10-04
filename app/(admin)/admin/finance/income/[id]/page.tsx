import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { IncomeForm } from "@/components/admin/income-form";
import { listClients, listIncome, listProjects } from "@/lib/db/business";

export const metadata = { title: "Edit income" };

export default async function EditIncomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entries, clients, projects] = await Promise.all([
    listIncome(),
    listClients(),
    listProjects({ includeArchived: true }),
  ]);
  const entry = entries.find((e) => e.id === id);
  if (!entry) notFound();

  return (
    <>
      <PageHeader title="Edit income" />
      <IncomeForm entry={entry} clients={clients} projects={projects} />
    </>
  );
}
