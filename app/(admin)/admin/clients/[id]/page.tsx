import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ClientForm } from "@/components/admin/client-form";
import { getClient } from "@/lib/db/business";

export const metadata = { title: "Edit client" };

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <>
      <PageHeader title={client.name} description="Edit this client." />
      <ClientForm client={client} />
    </>
  );
}
