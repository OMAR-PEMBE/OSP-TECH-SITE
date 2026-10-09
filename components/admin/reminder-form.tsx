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
import {
  addDays,
  parseDarDateTime,
  toDarDateInput,
  toDarDateTimeInput,
} from "@/lib/format";

/**
 * Create/edit a reminder (FR-A10).
 *
 * The due field is `datetime-local`, whose value has no timezone — it is read
 * as Dar es Salaam time, which is what the owner means when they type it, and
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
  /* `datetime-local` wants "YYYY-MM-DDTHH:mm". It is shown in Dar es Salaam
     time explicitly — not the browser's or the server's zone — because that
     is how the action reads it back; any other zone would drift the time on
     every save, and would differ between the server render and hydration. */
  const dueLocal = toDarDateTimeInput(
    reminder ? new Date(reminder.dueAt) : defaultDue(),
  );

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

/** Tomorrow at 09:00 in Dar es Salaam — a sensible default for a new reminder. */
function defaultDue(): Date {
  const tomorrow = addDays(toDarDateInput(), 1);
  return parseDarDateTime(`${tomorrow}T09:00`)!;
}
