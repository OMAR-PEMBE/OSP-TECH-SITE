"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, GripVertical } from "lucide-react";
import { moveProjectStatus } from "@/app/actions/business";
import { formatTzs, formatDateShort } from "@/lib/format";
import {
  KANBAN_COLUMNS,
  PROJECT_STATUS_LABELS,
} from "@/lib/validation/business";
import { cn } from "@/lib/utils/cn";
import type { Project } from "@/lib/db/business";

/**
 * Projects kanban (FR-A9, UI-UX.md 7).
 *
 * Columns: Planning, In progress, Testing, Completed. Cards drag between
 * them; an overdue project gets an amber left border and a warning icon, so
 * the signal is never colour alone (WCAG 1.4.1).
 *
 * Accessibility: HTML drag-and-drop is mouse-only, so every card also has a
 * status `<select>`. That is not a lesser fallback bolted on — it is the
 * primary control on a phone, where dragging between columns that do not fit
 * on screen is unusable. The drag is the enhancement.
 */
export function ProjectBoard({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function move(id: string, status: string) {
    startTransition(async () => {
      const result = await moveProjectStatus(id, status);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div>
      {error && (
        <p role="alert" className="text-small text-danger-text mb-3">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        {KANBAN_COLUMNS.map((column) => {
          const columnProjects = projects.filter((p) => p.status === column);

          return (
            <section
              key={column}
              aria-label={PROJECT_STATUS_LABELS[column]}
              onDragOver={(e) => {
                /* Required for the drop to be allowed at all. */
                e.preventDefault();
                setOver(column);
              }}
              onDragLeave={() => setOver((c) => (c === column ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id && dragging) move(id, column);
                setDragging(null);
              }}
              className={cn(
                "rounded-card border p-3 transition-colors",
                over === column
                  ? "border-blue-strong bg-cloud"
                  : "border-border bg-cloud/50",
              )}
            >
              <h2 className="text-label text-slate flex items-center justify-between px-1 uppercase">
                {PROJECT_STATUS_LABELS[column]}
                <span className="text-slate tabular-nums">
                  {columnProjects.length}
                </span>
              </h2>

              <ul className="mt-3 flex flex-col gap-2">
                {columnProjects.length === 0 && (
                  <li className="text-small text-slate rounded-input border-border border border-dashed px-3 py-6 text-center">
                    Nothing here
                  </li>
                )}

                {columnProjects.map((project) => (
                  <li key={project.id}>
                    <article
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", project.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragging(project.id);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                      className={cn(
                        "rounded-input border bg-white p-3 transition-opacity",
                        dragging === project.id && "opacity-50",
                        project.overdue
                          ? "border-border border-l-warning border-l-4"
                          : "border-border",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical
                          aria-hidden
                          className="text-slate mt-0.5 size-4 shrink-0 cursor-grab"
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/projects/${project.id}`}
                            className="text-small text-navy rounded-input font-semibold underline-offset-4 hover:underline"
                          >
                            {project.name}
                          </Link>

                          {project.clientName && (
                            <p className="text-small text-slate mt-0.5 truncate">
                              {project.clientName}
                            </p>
                          )}

                          {project.overdue && project.deadline && (
                            <p className="text-small text-warning-text mt-1 flex items-center gap-1 font-semibold">
                              <AlertTriangle aria-hidden className="size-3.5" />
                              Overdue {formatDateShort(project.deadline)}
                            </p>
                          )}

                          {project.tasksTotal > 0 && (
                            <div className="mt-2">
                              <div
                                className="bg-cloud h-1.5 w-full overflow-hidden rounded-full"
                                role="progressbar"
                                aria-valuenow={project.progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${project.name} progress`}
                              >
                                <div
                                  className="bg-teal h-full rounded-full"
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                              <p className="text-label text-slate mt-1">
                                {project.tasksDone}/{project.tasksTotal} tasks ·{" "}
                                {project.progress}%
                              </p>
                            </div>
                          )}

                          <p className="text-label text-slate mt-2 tabular-nums">
                            {formatTzs(BigInt(project.amountPaid))} of{" "}
                            {formatTzs(BigInt(project.price))}
                          </p>

                          {/* The accessible way to move a card. */}
                          <label className="mt-2 block">
                            <span className="sr-only">
                              Status for {project.name}
                            </span>
                            <select
                              value={project.status}
                              disabled={pending}
                              onChange={(e) => move(project.id, e.target.value)}
                              className="rounded-input border-border text-label text-navy w-full border bg-white px-2 py-1.5"
                            >
                              {Object.entries(PROJECT_STATUS_LABELS).map(
                                ([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
