import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ReminderForm } from "@/components/admin/reminder-form";
import { getReminder, listClients, listProjects } from "@/lib/db/business";

export const metadata = { title: "Edit reminder" };

export default async function EditReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [reminder, projects, clients] = await Promise.all([
    getReminder(id),
    listProjects(),
    listClients(),
  ]);
  if (!reminder) notFound();

  return (
    <>
      <PageHeader title={reminder.title} description="Edit this reminder." />
      <ReminderForm reminder={reminder} projects={projects} clients={clients} />
    </>
  );
}
