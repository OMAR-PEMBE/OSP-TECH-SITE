import { PageHeader } from "@/components/admin/page-header";
import { ReminderForm } from "@/components/admin/reminder-form";
import { listClients, listProjects } from "@/lib/db/business";

export const metadata = { title: "New reminder" };

export default async function NewReminderPage() {
  const [projects, clients] = await Promise.all([
    listProjects(),
    listClients(),
  ]);

  return (
    <>
      <PageHeader title="New reminder" />
      <ReminderForm projects={projects} clients={clients} />
    </>
  );
}
