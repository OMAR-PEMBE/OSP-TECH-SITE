"use client";

import Link from "next/link";
import { Card } from "@/components/admin/card";
import { EntityForm } from "@/components/admin/entity-form";
import { SelectField, TextAreaField, TextField } from "@/components/admin/form";
import { saveProject } from "@/app/actions/business";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from "@/lib/validation/business";
import type { Client, Project } from "@/lib/db/business";

/** Create/edit a project (FR-A9). */
export function ProjectForm({
  project,
  clients,
}: {
  project?: Project;
  clients: Client[];
}) {
  const clientOptions = [
    { value: "", label: "No client" },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <EntityForm
      action={saveProject.bind(null, project?.id ?? null)}
      redirectTo="/admin/projects"
      submitLabel={project ? "Save changes" : "Create project"}
      secondaryAction={
        <Link
          href="/admin/projects"
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
              label="Project name"
              name="name"
              required
              defaultValue={project?.name}
              error={errors.name}
            />
            <SelectField
              label="Client"
              name="client_id"
              options={clientOptions}
              defaultValue={project?.clientId ?? ""}
              error={errors.client_id}
            />
            <SelectField
              label="Type"
              name="type"
              options={Object.entries(PROJECT_TYPE_LABELS).map(
                ([value, label]) => ({ value, label }),
              )}
              defaultValue={project?.type ?? "other"}
              error={errors.type}
            />
            <TextAreaField
              label="Description"
              name="description"
              rows={4}
              defaultValue={project?.description ?? ""}
              error={errors.description}
            />
          </Card>

          <Card className="flex flex-col gap-5">
            <TextField
              label="Agreed price (TZS)"
              name="price"
              inputMode="numeric"
              defaultValue={project?.price ?? "0"}
              error={errors.price}
              hint="Whole shillings, no decimals. Payments are recorded in Finance."
            />
            <SelectField
              label="Status"
              name="status"
              options={Object.entries(PROJECT_STATUS_LABELS).map(
                ([value, label]) => ({ value, label }),
              )}
              defaultValue={project?.status ?? "planning"}
              error={errors.status}
            />
            <TextField
              label="Start date"
              name="start_date"
              type="date"
              defaultValue={project?.startDate ?? ""}
              error={errors.start_date}
            />
            <TextField
              label="Deadline"
              name="deadline"
              type="date"
              defaultValue={project?.deadline ?? ""}
              error={errors.deadline}
              hint="Past this date an unfinished project is flagged as overdue."
            />
            <TextAreaField
              label="Notes"
              name="notes"
              rows={4}
              defaultValue={project?.notes ?? ""}
              error={errors.notes}
            />
          </Card>
        </>
      )}
    </EntityForm>
  );
}
