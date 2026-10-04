import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PortfolioForm } from "@/components/admin/portfolio-form";
import { getPortfolioItem } from "@/lib/db/admin";

export const metadata = { title: "Edit project" };

export default async function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getPortfolioItem(id);
  if (!item) notFound();

  return (
    <>
      <PageHeader title={item.title} description="Edit this project." />
      <PortfolioForm item={item} />
    </>
  );
}
