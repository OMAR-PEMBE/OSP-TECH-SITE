import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/admin/card";
import { EmptyState } from "@/components/admin/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { RowActions } from "@/components/admin/row-actions";
import { listClients } from "@/lib/db/business";
import { deleteClient } from "@/app/actions/business";

/** Admin → Clients (API.md 4.3). */
export const metadata = { title: "Clients" };

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await listClients(q);

  return (
    <>
      <PageHeader
        title="Clients"
        description="The people and businesses you work with."
        actions={
          <ButtonLink href="/admin/clients/new" size="sm">
            <Plus aria-hidden className="size-4" />
            Add client
          </ButtonLink>
        }
      />

      {/* A plain GET form: search survives a refresh, is shareable as a URL,
          and needs no JavaScript. */}
      <form method="get" role="search" className="mt-6 flex max-w-md gap-2">
        <label htmlFor="client-search" className="sr-only">
          Search clients
        </label>
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="text-slate pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <input
            id="client-search"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Name, business or phone"
            className="rounded-input border-border text-body text-navy w-full border bg-white py-2.5 pr-3 pl-9"
          />
        </div>
        <button
          type="submit"
          className="rounded-input bg-blue-strong text-small min-h-[44px] px-4 font-semibold text-white"
        >
          Search
        </button>
      </form>

      <div className="mt-6">
        {clients.length === 0 ? (
          <EmptyState
            title={q ? "No clients match that search" : "No clients yet"}
            description={
              q
                ? "Try a different name, business or phone number."
                : "Add your first client to link them to projects and income."
            }
            action={
              !q && (
                <ButtonLink href="/admin/clients/new" size="sm">
                  Add a client
                </ButtonLink>
              )
            }
          />
        ) : (
          <Card className="p-0 sm:p-0">
            <ul className="divide-border divide-y">
              {clients.map((client) => (
                <li
                  key={client.id}
                  className="flex flex-wrap items-center gap-3 p-4 sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-body text-navy rounded-input font-semibold underline-offset-4 hover:underline"
                    >
                      {client.name}
                    </Link>
                    <p className="text-small text-slate mt-0.5 truncate">
                      {[client.businessName, client.phone, client.email]
                        .filter(Boolean)
                        .join(" · ") || "No contact details"}
                    </p>
                  </div>

                  <RowActions
                    editHref={`/admin/clients/${client.id}`}
                    onDelete={deleteClient.bind(null, client.id)}
                    deleteLabel={`Delete ${client.name}`}
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
