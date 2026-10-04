import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default function Page() {
  return (
    <>
      <PageHeader title="New product" />
      <ProductForm />
    </>
  );
}
