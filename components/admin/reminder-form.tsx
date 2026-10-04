"use client";

import Link from "next/link";
import { Card } from "@/components/admin/card";
import { EntityForm } from "@/components/admin/entity-form";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/form";
import { saveReminder } from "@/app/actions/business";
import { REPEAT_LABELS } from "@/lib/validation/business";
import type { Client, Project, Reminder } from "@/lib/db/business";

/**
 * Create/edit a reminder (FR-A10).
 *
 * The due field is `datetime-local`, whose value has no timezone — it is read
 * as the owner's local time, which is what they mean when they type it, and
 * stored as a timestamptz.
 */
export function ReminderForm({
  reminder,
  projects,
  clients,
}: {
  reminder?: Reminder;
  projects: Project[];
  clients: Client[];
}) {
  /* `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time. Slicing the ISO
     string would show UTC, putting the time three hours out in Tanzania. */
  const dueLocal = reminder
    ? toLocalInputValue(new Date(reminder.dueAt))
    : toLocalInputValue(defaultDue());

  return (
    <EntityForm
      action={saveReminder.bind(null, reminder?.id ?? null)}
      redirectTo="/admin/reminders"
      submitLabel={reminder ? "Save changes" : "Add reminder"}
      secondaryAction={
        <Link
          href="/admin/reminders"
          className="text-small rounded-input text-slate px-2 font-semibold underline-offset-4 hover:underline"
        >
          Cancel
        </Link>
      }
    >
      {(errors) => (
        <>
          <Card className="flex flex-col gap-5">
            <TextField
              label="Title"
              name="title"
              required
              defaultValue={reminder?.title}
              error={errors.title}
              placeholder="Chase final payment"
            />
            <TextField
              label="Due"
              name="due_at"
              type="datetime-local"
              required
              defaultValue={dueLocal}
              error={errors.due_at}
            />
            <SelectField
              label="Repeat"
              name="repeat_rule"
              options={Object.entries(REPEAT_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              defaultValue={reminder?.repeatRule ?? "none"}
              error={errors.repeat_rule}
              hint="A repeating reminder creates its next occurrence when you mark it done."
            />
            <TextAreaField
              label="Notes"
              name="description"
              rows={3}
              defaultValue={reminder?.description ?? ""}
              error={errors.description}
            />
          </Card>

          <Card className="flex flex-col gap-5">
            <SelectField
              label="Project"
              name="project_id"
              options={[
                { value: "", label: "Not linked to a project" },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
              defaultValue={reminder?.projectId ?? ""}
              error={errors.project_id}
            />
            <SelectField
              label="Client"
              name="client_id"
              options={[
                { value: "", label: "Not linked to a client" },
                ...clients.map((c) => ({ value: c.id, label: c.name })),
              ]}
              defaultValue={reminder?.clientId ?? ""}
              error={errors.client_id}
            />
            <CheckboxField
              label="Email me when this is due"
              name="notify_email"
              defaultChecked={reminder?.notifyEmail ?? true}
            />
          </Card>
        </>
      )}
    </EntityForm>
  );
}

/** Tomorrow at 09:00 — a sensible default for a reminder someone just made. */
function defaultDue(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
}

/** `Date` → "YYYY-MM-DDTHH:mm" in LOCAL time, for a datetime-local input. */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
