import { PageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";
import { listClients } from "@/lib/db/business";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const clients = await listClients();
  return (
    <>
      <PageHeader title="New project" />
      <ProjectForm clients={clients} />
    </>
  );
}
