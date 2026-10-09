"use client";

import Link from "next/link";
import { Card } from "@/components/admin/card";
import { EntityForm } from "@/components/admin/entity-form";
import { SelectField, TextAreaField, TextField } from "@/components/admin/form";
import { ReceiptUpload } from "@/components/admin/receipt-upload";
import { saveExpense } from "@/app/actions/business";
import {
  PAYMENT_METHOD_LABELS,
  REPEAT_LABELS,
} from "@/lib/validation/business";
import type { ExpenseCategory, ExpenseEntry } from "@/lib/db/business";
import { toDarDateInput } from "@/lib/format";

/** Record an expense (FR-A13). */
export function ExpenseForm({
  entry,
  categories,
}: {
  entry?: ExpenseEntry;
  categories: ExpenseCategory[];
}) {
  /* Dar es Salaam's date: the UTC date is still yesterday until 03:00 EAT. */
  const today = toDarDateInput();

  return (
    <EntityForm
      action={saveExpense.bind(null, entry?.id ?? null)}
      redirectTo="/admin/finance"
      submitLabel={entry ? "Save changes" : "Record expense"}
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
              hint="Whole shillings."
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
              label="Category"
              name="category_id"
              options={[
                { value: "", label: "Uncategorised" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              defaultValue={entry?.categoryId ?? ""}
              error={errors.category_id}
            />
            <SelectField
              label="Method"
              name="method"
              options={Object.entries(PAYMENT_METHOD_LABELS).map(
                ([value, label]) => ({ value, label }),
              )}
              defaultValue={entry?.method ?? "cash"}
              error={errors.method}
            />
          </Card>

          <Card className="flex flex-col gap-5">
            <TextAreaField
              label="Description"
              name="description"
              rows={3}
              defaultValue={entry?.description ?? ""}
              error={errors.description}
            />
            <SelectField
              label="Recurring"
              name="recurring"
              options={Object.entries(REPEAT_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              defaultValue={entry?.recurring ?? "none"}
              error={errors.recurring}
              hint="For regular costs like hosting."
            />
            <ReceiptUpload defaultPath={entry?.receiptUrl} />
          </Card>
        </>
      )}
    </EntityForm>
  );
}
