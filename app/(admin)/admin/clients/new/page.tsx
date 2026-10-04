import { PageHeader } from "@/components/admin/page-header";
import { ClientForm } from "@/components/admin/client-form";

export const metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <>
      <PageHeader title="New client" />
      <ClientForm />
    </>
  );
}
