import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/admin/card";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
import { ButtonLink } from "@/components/ui/button";
import { RowActions } from "@/components/admin/row-actions";
import { listServices } from "@/lib/db/admin";
import { deleteService, toggleServiceVisible } from "@/app/actions/content";

/** Admin → Services (FR-A4). */
export const metadata = { title: "Services" };

export default async function AdminServicesPage() {
  const services = await listServices();

  return (
    <>
      <PageHeader
        title="Services"
        description="What appears in “What We Do” on the site."
        actions={
          <ButtonLink href="/admin/services/new" size="sm">
            <Plus aria-hidden className="size-4" />
            New service
          </ButtonLink>
        }
      />

      <div className="mt-6">
        {services.length === 0 ? (
          <EmptyState
            title="No services yet"
            description="Add your first service and it will appear on the home page."
            action={
              <ButtonLink href="/admin/services/new" size="sm">
                Add a service
              </ButtonLink>
            }
          />
        ) : (
          <Card className="p-0 sm:p-0">
            <ul className="divide-border divide-y">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="flex flex-wrap items-center gap-3 p-4 sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/services/${service.id}`}
                        className="text-body text-navy rounded-input font-semibold underline-offset-4 hover:underline"
                      >
                        {service.name}
                      </Link>
                      {!service.visible && (
                        <StatusPill tone="neutral">Hidden</StatusPill>
                      )}
                    </div>
                    <p className="text-small text-slate mt-0.5 truncate">
                      /{service.slug}
                      {service.shortDesc ? ` — ${service.shortDesc}` : ""}
                    </p>
                  </div>

                  <RowActions
                    editHref={`/admin/services/${service.id}`}
                    visible={service.visible}
                    onToggle={toggleServiceVisible.bind(null, service.id)}
                    onDelete={deleteService.bind(null, service.id)}
                    deleteLabel={`Delete ${service.name}`}
                  />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
