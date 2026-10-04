"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, Repeat, Trash2 } from "lucide-react";
import { Card } from "@/components/admin/card";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
import {
  completeReminder,
  deleteReminder,
  reopenReminder,
} from "@/app/actions/business";
import { REPEAT_LABELS } from "@/lib/validation/business";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import type { Reminder, ReminderBucket } from "@/lib/db/business";

/**
 * Reminders, grouped into Overdue / Today / This week / Later / Done
 * (FR-A10).
 *
 * The buckets are computed on the server against the owner's day, then
 * rendered in that order, so the first thing on screen is always the thing
 * that is late.
 */

const BUCKET_LABELS: Record<ReminderBucket, string> = {
  overdue: "Overdue",
  today: "Today",
  week: "This week",
  later: "Later",
  done: "Done",
};

const BUCKET_ORDER: ReminderBucket[] = [
  "overdue",
  "today",
  "week",
  "later",
  "done",
];

export function ReminderList({
  grouped,
}: {
  grouped: Record<ReminderBucket, Reminder[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

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
      setConfirming(null);
      router.refresh();
    });
  }

  const total = BUCKET_ORDER.reduce((n, b) => n + grouped[b].length, 0);

  if (total === 0) {
    return (
      <EmptyState
        title="No reminders yet"
        description="Add a reminder for a deadline, a payment to chase, or anything you must not forget."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="text-small text-danger-text">
          {error}
        </p>
      )}

      {BUCKET_ORDER.map((bucket) => {
        const items = grouped[bucket];
        if (items.length === 0) return null;

        return (
          <section key={bucket}>
            <h2 className="text-label text-slate flex items-center gap-2 uppercase">
              {BUCKET_LABELS[bucket]}
              <span className="tabular-nums">({items.length})</span>
            </h2>

            <Card className="mt-3 p-0 sm:p-0">
              <ul className="divide-border divide-y">
                {items.map((reminder) => (
                  <li
                    key={reminder.id}
                    className={cn(
                      "flex flex-wrap items-start gap-3 p-4",
                      bucket === "overdue" && "border-l-danger border-l-4",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            "text-body font-semibold",
                            reminder.done
                              ? "text-slate line-through"
                              : "text-navy",
                          )}
                        >
                          {reminder.title}
                        </p>
                        {bucket === "overdue" && (
                          <StatusPill tone="danger">
                            <AlertTriangle
                              aria-hidden
                              className="mr-1 size-3"
                            />
                            Overdue
                          </StatusPill>
                        )}
                        {reminder.repeatRule !== "none" && (
                          <StatusPill tone="neutral">
                            <Repeat aria-hidden className="mr-1 size-3" />
                            {
                              REPEAT_LABELS[
                                reminder.repeatRule as keyof typeof REPEAT_LABELS
                              ]
                            }
                          </StatusPill>
                        )}
                      </div>

                      <p className="text-small text-slate mt-0.5">
                        {formatDate(reminder.dueAt)}
                        {reminder.projectName
                          ? ` · ${reminder.projectName}`
                          : ""}
                        {reminder.clientName ? ` · ${reminder.clientName}` : ""}
                      </p>

                      {reminder.description && (
                        <p className="text-small text-navy mt-1.5 whitespace-pre-wrap">
                          {reminder.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {reminder.done ? (
                        <button
                          type="button"
                          onClick={() => run(() => reopenReminder(reminder.id))}
                          disabled={pending}
                          className="rounded-input text-small text-navy hover:bg-cloud min-h-[40px] px-3 font-semibold"
                        >
                          Reopen
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            run(() => completeReminder(reminder.id))
                          }
                          disabled={pending}
                          className="rounded-input bg-blue-strong text-small min-h-[40px] px-3 font-semibold text-white disabled:opacity-50"
                        >
                          Mark done
                        </button>
                      )}

                      <Link
                        href={`/admin/reminders/${reminder.id}`}
                        className="rounded-input text-small text-navy hover:bg-cloud inline-flex min-h-[40px] items-center px-3 font-semibold"
                      >
                        Edit
                      </Link>

                      {confirming === reminder.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              run(() => deleteReminder(reminder.id))
                            }
                            disabled={pending}
                            className="rounded-input bg-danger text-small min-h-[40px] px-3 font-semibold text-white"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(null)}
                            className="rounded-input text-small text-navy hover:bg-cloud min-h-[40px] px-3 font-semibold"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirming(reminder.id)}
                          aria-label={`Delete reminder: ${reminder.title}`}
                          className="rounded-input text-navy hover:bg-cloud inline-flex size-10 items-center justify-center"
                        >
                          <Trash2 aria-hidden className="text-danger size-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
