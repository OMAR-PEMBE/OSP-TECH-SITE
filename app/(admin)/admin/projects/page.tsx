import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { ProjectBoard } from "@/components/admin/project-board";
import { listProjects } from "@/lib/db/business";

/** Admin → Projects, as a kanban board (FR-A9). */
export const metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  const projects = await listProjects();
  const overdue = projects.filter((p) => p.overdue).length;

  return (
    <>
      <PageHeader
        title="Projects"
        description={
          overdue > 0
            ? `${overdue} project${overdue === 1 ? " is" : "s are"} past the deadline.`
            : "Drag a card, or change its status, to move it along."
        }
        actions={
          <ButtonLink href="/admin/projects/new" size="sm">
            <Plus aria-hidden className="size-4" />
            New project
          </ButtonLink>
        }
      />

      <div className="mt-6">
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Add your first project to track its progress, deadline and payments."
            action={
              <ButtonLink href="/admin/projects/new" size="sm">
                Add a project
              </ButtonLink>
            }
          />
        ) : (
          <ProjectBoard projects={projects} />
        )}
      </div>
    </>
  );
}
