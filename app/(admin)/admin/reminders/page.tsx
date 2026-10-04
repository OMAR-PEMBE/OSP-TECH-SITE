import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { ReminderList } from "@/components/admin/reminder-list";
import { bucketFor, listReminders } from "@/lib/db/business";
import type { Reminder, ReminderBucket } from "@/lib/db/business";

/** Admin → Reminders (FR-A10). */
export const metadata = { title: "Reminders" };

export default async function AdminRemindersPage() {
  const reminders = await listReminders();

  const grouped: Record<ReminderBucket, Reminder[]> = {
    overdue: [],
    today: [],
    week: [],
    later: [],
    done: [],
  };

  for (const reminder of reminders) {
    grouped[bucketFor(reminder.dueAt, reminder.done)].push(reminder);
  }

  const outstanding = grouped.overdue.length + grouped.today.length;

  return (
    <>
      <PageHeader
        title="Reminders"
        description={
          outstanding > 0
            ? `${outstanding} need${outstanding === 1 ? "s" : ""} attention today.`
            : "Nothing due today."
        }
        actions={
          <ButtonLink href="/admin/reminders/new" size="sm">
            <Plus aria-hidden className="size-4" />
            New reminder
          </ButtonLink>
        }
      />

      <div className="mt-6">
        <ReminderList grouped={grouped} />
      </div>
    </>
  );
}
