"use client";

import Link from "next/link";
import { Card } from "@/components/admin/card";
import { EntityForm } from "@/components/admin/entity-form";
import { SelectField, TextAreaField, TextField } from "@/components/admin/form";
import { saveIncome } from "@/app/actions/business";
import { PAYMENT_METHOD_LABELS } from "@/lib/validation/business";
import type { Client, IncomeEntry, Project } from "@/lib/db/business";

/** Record income (FR-A12). */
export function IncomeForm({
  entry,
  clients,
  projects,
}: {
  entry?: IncomeEntry;
  clients: Client[];
  projects: Project[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <EntityForm
      action={saveIncome.bind(null, entry?.id ?? null)}
      redirectTo="/admin/finance"
      submitLabel={entry ? "Save changes" : "Record income"}
      secondaryAction={
        <Link
          href="/admin/finance"
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
              label="Amount (TZS)"
              name="amount"
              inputMode="numeric"
              required
              defaultValue={entry?.amount ?? ""}
              error={errors.amount}
              hint="Whole shillings. You can type separators, like 2,500,000."
            />
            <TextField
              label="Date"
              name="date"
              type="date"
              required
              defaultValue={entry?.date ?? today}
              error={errors.date}
            />
            <SelectField
              label="Method"
              name="method"
              options={Object.entries(PAYMENT_METHOD_LABELS).map(
                ([value, label]) => ({ value, label }),
              )}
              defaultValue={entry?.method ?? "mpesa"}
              error={errors.method}
            />
            <TextField
              label="Reference"
              name="reference"
              defaultValue={entry?.reference ?? ""}
              error={errors.reference}
              hint="The transaction code from the payment message."
            />
          </Card>

          <Card className="flex flex-col gap-5">
            <SelectField
              label="Client"
              name="client_id"
              options={[
                { value: "", label: "No client" },
                ...clients.map((c) => ({ value: c.id, label: c.name })),
              ]}
              defaultValue={entry?.clientId ?? ""}
              error={errors.client_id}
            />
            <SelectField
              label="Project"
              name="project_id"
              options={[
                { value: "", label: "No project" },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
              defaultValue={entry?.projectId ?? ""}
              error={errors.project_id}
              hint="Linking a payment updates that project's paid-vs-price figure."
            />
            <TextField
              label="Category"
              name="category"
              defaultValue={entry?.category ?? ""}
              error={errors.category}
              hint="For example: WiFi revenue share, Custom build."
            />
            <TextAreaField
              label="Notes"
              name="notes"
              rows={3}
              defaultValue={entry?.notes ?? ""}
              error={errors.notes}
            />
          </Card>
        </>
      )}
    </EntityForm>
  );
}
