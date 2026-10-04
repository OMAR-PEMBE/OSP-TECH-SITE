"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/admin/card";
import { addTask, deleteTask, toggleTask } from "@/app/actions/business";
import type { ProjectTask } from "@/lib/db/business";

/**
 * Task checklist (FR-A9).
 *
 * Ticking tasks is what drives the project's progress percentage, so this is
 * the control the board's progress bar actually reflects.
 *
 * Each toggle re-fetches rather than tracking its own optimistic copy: the
 * percentage is derived server-side from all tasks, and a local guess that
 * disagreed with the board would be worse than a brief wait.
 */
export function TaskChecklist({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: ProjectTask[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const done = tasks.filter((t) => t.done).length;
  const progress =
    tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);

  function run(
    fn: () => Promise<{ ok: boolean; error?: { message: string } }>,
  ) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error?.message ?? "Something went wrong.");
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  function onAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await addTask(projectId, formData);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setError(null);
      form.reset();
      /* Keep focus in the field so several tasks can be typed in a row. */
      formRef.current?.querySelector<HTMLInputElement>("#new-task")?.focus();
      router.refresh();
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h3 text-navy font-semibold">Tasks</h2>
        <p className="text-small text-slate tabular-nums">
          {done}/{tasks.length} done · {progress}%
        </p>
      </div>

      {tasks.length > 0 && (
        <div
          className="bg-cloud mt-3 h-2 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Project progress"
        >
          <div
            className="bg-teal h-full rounded-full transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-1">
        {tasks.length === 0 && (
          <li className="text-small text-slate py-2">
            No tasks yet — add the first step below.
          </li>
        )}

        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2">
            <label className="text-small text-navy flex min-h-[44px] flex-1 items-center gap-3">
              <input
                type="checkbox"
                checked={task.done}
                disabled={pending}
                onChange={(e) =>
                  run(() => toggleTask(task.id, e.target.checked))
                }
                className="accent-blue-strong size-5 shrink-0"
              />
              <span className={task.done ? "text-slate line-through" : ""}>
                {task.title}
              </span>
            </label>

            <button
              type="button"
              onClick={() => run(() => deleteTask(task.id))}
              disabled={pending}
              aria-label={`Delete task: ${task.title}`}
              className="rounded-input text-navy hover:bg-cloud inline-flex size-10 shrink-0 items-center justify-center"
            >
              <Trash2 aria-hidden className="text-danger size-4" />
            </button>
          </li>
        ))}
      </ul>

      <form ref={formRef} onSubmit={onAdd} className="mt-4 flex gap-2">
        <label htmlFor="new-task" className="sr-only">
          New task
        </label>
        <input
          id="new-task"
          name="title"
          required
          placeholder="Add a task…"
          className="rounded-input border-border text-body text-navy flex-1 border bg-white px-3 py-2.5"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-input bg-blue-strong text-small inline-flex min-h-[44px] items-center gap-1.5 px-4 font-semibold text-white disabled:opacity-50"
        >
          <Plus aria-hidden className="size-4" />
          Add
        </button>
      </form>

      {error && (
        <p role="alert" className="text-small text-danger-text mt-2">
          {error}
        </p>
      )}
    </Card>
  );
}
