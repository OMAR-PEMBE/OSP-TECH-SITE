import { PageHeader } from "@/components/admin/page-header";
import { IncomeForm } from "@/components/admin/income-form";
import { listClients, listProjects } from "@/lib/db/business";

export const metadata = { title: "Record income" };

export default async function NewIncomePage() {
  const [clients, projects] = await Promise.all([
    listClients(),
    listProjects({ includeArchived: true }),
  ]);
  return (
    <>
      <PageHeader title="Record income" />
      <IncomeForm clients={clients} projects={projects} />
    </>
  );
}
