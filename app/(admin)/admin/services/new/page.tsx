import { PageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/service-form";

export const metadata = { title: "New service" };

export default function NewServicePage() {
  return (
    <>
      <PageHeader
        title="New service"
        description="It appears on the site as soon as it is visible."
      />
      <ServiceForm />
    </>
  );
}
