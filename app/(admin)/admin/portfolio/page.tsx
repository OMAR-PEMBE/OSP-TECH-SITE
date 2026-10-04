import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/admin/card";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
import { ButtonLink } from "@/components/ui/button";
import { RowActions } from "@/components/admin/row-actions";
import { listPortfolio } from "@/lib/db/admin";
import {
  deletePortfolioItem,
  togglePortfolioVisible,
} from "@/app/actions/content";

/** Admin → Portfolio (FR-A5). */
export const metadata = { title: "Portfolio" };

export default async function AdminPortfolioPage() {
  const items = await listPortfolio();

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Work shown in Our Work on the home page."
        actions={
          <ButtonLink href="/admin/portfolio/new" size="sm">
            <Plus aria-hidden className="size-4" />
            New project
          </ButtonLink>
        }
      />

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Add your first project to show it on the site."
            action={
              <ButtonLink href="/admin/portfolio/new" size="sm">
                Add a project
              </ButtonLink>
            }
          />
        ) : (
          <Card className="p-0 sm:p-0">
            <ul className="divide-border divide-y">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 p-4 sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/portfolio/${item.id}`}
                        className="text-body text-navy rounded-input font-semibold underline-offset-4 hover:underline"
                      >
                        {item.title}
                      </Link>
                      {!item.visible && (
                        <StatusPill tone="neutral">Hidden</StatusPill>
                      )}
                    </div>
                    <p className="text-small text-slate mt-0.5 truncate">
                      /portfolio/{item.slug}
                      {item.type ? ` — ${item.type}` : ""}
                    </p>
                  </div>

                  <RowActions
                    editHref={`/admin/portfolio/${item.id}`}
                    visible={item.visible}
                    onToggle={togglePortfolioVisible.bind(null, item.id)}
                    onDelete={deletePortfolioItem.bind(null, item.id)}
                    deleteLabel={`Delete ${item.title}`}
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
