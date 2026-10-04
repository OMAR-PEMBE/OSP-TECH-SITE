import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, StatCard } from "@/components/admin/card";
import { StatusPill } from "@/components/admin/status-pill";
import { TaskChecklist } from "@/components/admin/task-checklist";
import { ProjectForm } from "@/components/admin/project-form";
import {
  getProject,
  listClients,
  listIncome,
  listProjectTasks,
} from "@/lib/db/business";
import { formatDate, formatTzs } from "@/lib/format";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from "@/lib/validation/business";

/** Admin → one project: money, tasks and details (FR-A9). */
export const metadata = { title: "Project" };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, tasks, clients, income] = await Promise.all([
    getProject(id),
    listProjectTasks(id),
    listClients(),
    listIncome({ projectId: id }),
  ]);

  if (!project) notFound();

  const price = BigInt(project.price);
  const paid = BigInt(project.amountPaid);
  const outstanding = price > paid ? price - paid : 0n;

  const statusTone =
    project.status === "completed"
      ? "positive"
      : project.status === "cancelled"
        ? "danger"
        : project.overdue
          ? "warning"
          : "info";

  return (
    <>
      <Link
        href="/admin/projects"
        className="text-small rounded-input text-blue-strong mb-4 inline-flex items-center gap-1.5 font-semibold"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All projects
      </Link>

      <PageHeader
        title={project.name}
        description={
          [
            project.clientName,
            PROJECT_TYPE_LABELS[
              project.type as keyof typeof PROJECT_TYPE_LABELS
            ],
          ]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        actions={
          <StatusPill tone={statusTone}>
            {
              PROJECT_STATUS_LABELS[
                project.status as keyof typeof PROJECT_STATUS_LABELS
              ]
            }
          </StatusPill>
        }
      />

      {project.overdue && project.deadline && (
        <p className="rounded-card border-warning bg-warning/10 text-small text-navy mt-4 flex items-center gap-2 border-l-4 p-3 font-semibold">
          <AlertTriangle aria-hidden className="text-warning size-4 shrink-0" />
          This project passed its deadline on {formatDate(project.deadline)}.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Agreed price" value={formatTzs(price)} />
        <StatCard
          label="Paid so far"
          value={formatTzs(paid)}
          trend={`${income.length} payment${income.length === 1 ? "" : "s"}`}
          tone={paid > 0n ? "positive" : "neutral"}
        />
        <StatCard
          label="Outstanding"
          value={formatTzs(outstanding)}
          trend={outstanding === 0n ? "Fully paid" : undefined}
          tone={outstanding === 0n ? "positive" : "warning"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TaskChecklist projectId={project.id} tasks={tasks} />

        <Card>
          <h2 className="text-h3 text-navy font-semibold">Payments</h2>
          {income.length === 0 ? (
            <p className="text-small text-slate mt-3">
              No payments recorded against this project yet. Add them under
              Finance → Income and link them here.
            </p>
          ) : (
            <ul className="divide-border mt-3 divide-y">
              {income.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-small text-navy font-semibold tabular-nums">
                      {formatTzs(BigInt(entry.amount))}
                    </p>
                    <p className="text-small text-slate">
                      {formatDate(entry.date)}
                      {entry.reference ? ` · ${entry.reference}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-h2 text-navy font-bold">Project details</h2>
        <ProjectForm project={project} clients={clients} />
      </div>
    </>
  );
}
