import Link from "next/link";
import { AlertTriangle, ArrowRight, Mail } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, StatCard } from "@/components/admin/card";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
import { FinanceCharts } from "@/components/admin/finance-charts";
import { requireOwner } from "@/lib/auth/session";
import { countNewMessages, listMessages } from "@/lib/db/admin";
import {
  bucketFor,
  getFinanceSummary,
  listProjects,
  listReminders,
} from "@/lib/db/business";
import { darMonthStart, formatDateShort, formatTzs } from "@/lib/format";
import { PROJECT_STATUS_LABELS } from "@/lib/validation/business";

/**
 * Admin dashboard (FR-A3).
 *
 * The question this page answers is "what needs me today": money this month,
 * work in flight, anything overdue, anyone waiting for a reply.
 */
export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const session = await requireOwner();

  /* This month, in Dar es Salaam — independent of the server's timezone. */
  const monthStart = darMonthStart();

  const [
    newMessages,
    recentMessages,
    projects,
    reminders,
    monthSummary,
    allTimeSummary,
  ] = await Promise.all([
    countNewMessages(),
    listMessages({ status: "new" }),
    listProjects(),
    listReminders(),
    getFinanceSummary({ from: monthStart }),
    getFinanceSummary(),
  ]);

  const firstName = session.fullName?.split(" ")[0];

  const activeProjects = projects.filter(
    (p) => p.status !== "completed" && p.status !== "cancelled",
  );
  const overdueProjects = projects.filter((p) => p.overdue);

  const openReminders = reminders.filter((r) => !r.done);
  const overdueReminders = openReminders.filter(
    (r) => bucketFor(r.dueAt, r.done) === "overdue",
  );
  const todayReminders = openReminders.filter(
    (r) => bucketFor(r.dueAt, r.done) === "today",
  );
  const upcoming = [...overdueReminders, ...todayReminders].slice(0, 6);

  const monthProfit = BigInt(monthSummary.profit);

  return (
    <>
      <PageHeader
        title={firstName ? `Habari, ${firstName}` : "Dashboard"}
        description="What needs your attention today."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Income this month"
          value={formatTzs(BigInt(monthSummary.incomeTotal))}
          tone="positive"
        />
        <StatCard
          label="Expenses this month"
          value={formatTzs(BigInt(monthSummary.expenseTotal))}
          tone="warning"
        />
        <StatCard
          label="Profit this month"
          value={formatTzs(monthProfit)}
          trend={monthProfit < 0n ? "Running at a loss" : "In the black"}
          tone={monthProfit < 0n ? "negative" : "positive"}
        />
        <StatCard
          label="New messages"
          value={String(newMessages)}
          trend={newMessages > 0 ? "Waiting for a reply" : "All caught up"}
          tone={newMessages > 0 ? "warning" : "positive"}
        />
      </div>

      {(overdueProjects.length > 0 || overdueReminders.length > 0) && (
        <p className="rounded-card border-warning bg-warning/10 text-small text-navy mt-6 flex flex-wrap items-center gap-2 border-l-4 p-3 font-semibold">
          <AlertTriangle aria-hidden className="text-warning size-4 shrink-0" />
          {[
            overdueProjects.length > 0 &&
              `${overdueProjects.length} overdue project${overdueProjects.length === 1 ? "" : "s"}`,
            overdueReminders.length > 0 &&
              `${overdueReminders.length} overdue reminder${overdueReminders.length === 1 ? "" : "s"}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-h2 text-navy font-bold">Active projects</h2>
            <Link
              href="/admin/projects"
              className="text-small rounded-input text-blue-strong inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
            >
              Board
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>

          <div className="mt-3">
            {activeProjects.length === 0 ? (
              <EmptyState
                title="No active projects"
                description="Add a project to track its progress and payments."
              />
            ) : (
              <Card className="p-0 sm:p-0">
                <ul className="divide-border divide-y">
                  {activeProjects.slice(0, 6).map((project) => (
                    <li key={project.id} className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="text-small text-navy rounded-input font-semibold underline-offset-4 hover:underline"
                        >
                          {project.name}
                        </Link>
                        <StatusPill tone={project.overdue ? "warning" : "info"}>
                          {
                            PROJECT_STATUS_LABELS[
                              project.status as keyof typeof PROJECT_STATUS_LABELS
                            ]
                          }
                        </StatusPill>
                      </div>
                      <p className="text-small text-slate mt-0.5 tabular-nums">
                        {formatTzs(BigInt(project.amountPaid))} of{" "}
                        {formatTzs(BigInt(project.price))}
                        {project.tasksTotal > 0
                          ? ` · ${project.progress}% done`
                          : ""}
                        {project.deadline
                          ? ` · due ${formatDateShort(project.deadline)}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-h2 text-navy font-bold">Reminders</h2>
            <Link
              href="/admin/reminders"
              className="text-small rounded-input text-blue-strong inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
            >
              All reminders
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>

          <div className="mt-3">
            {upcoming.length === 0 ? (
              <EmptyState
                title="Nothing due today"
                description="Reminders that are due or overdue appear here."
              />
            ) : (
              <Card className="p-0 sm:p-0">
                <ul className="divide-border divide-y">
                  {upcoming.map((reminder) => {
                    const overdue =
                      bucketFor(reminder.dueAt, reminder.done) === "overdue";
                    return (
                      <li key={reminder.id} className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-small text-navy font-semibold">
                            {reminder.title}
                          </p>
                          <StatusPill tone={overdue ? "danger" : "info"}>
                            {overdue ? "Overdue" : "Today"}
                          </StatusPill>
                        </div>
                        <p className="text-small text-slate mt-0.5">
                          {formatDateShort(reminder.dueAt)}
                          {reminder.projectName
                            ? ` · ${reminder.projectName}`
                            : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h2 text-navy font-bold">New messages</h2>
          <Link
            href="/admin/messages"
            className="text-small rounded-input text-blue-strong inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
          >
            All messages
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="mt-3">
          {recentMessages.length === 0 ? (
            <EmptyState
              title="No new messages"
              description="Everything that comes through the contact form will show up here."
            />
          ) : (
            <Card className="p-0 sm:p-0">
              <ul className="divide-border divide-y">
                {recentMessages.slice(0, 4).map((message) => (
                  <li key={message.id} className="flex gap-3 p-4">
                    <span className="bg-cloud text-blue-strong rounded-input flex size-10 shrink-0 items-center justify-center">
                      <Mail aria-hidden className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-small text-navy font-semibold">
                        {message.name}
                      </p>
                      <p className="text-small text-slate mt-0.5">
                        {formatDateShort(message.createdAt)}
                        {message.need ? ` · ${message.need}` : ""}
                      </p>
                      <p className="text-small text-navy mt-1 line-clamp-2">
                        {message.message}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-h2 text-navy mb-4 font-bold">
          Income and expenses
        </h2>
        <FinanceCharts summary={allTimeSummary} />
      </section>
    </>
  );
}
