"use client";

import Link from "next/link";
import { Card } from "@/components/admin/card";
import { EntityForm } from "@/components/admin/entity-form";
import { TextAreaField, TextField } from "@/components/admin/form";
import { saveClient } from "@/app/actions/business";
import type { Client } from "@/lib/db/business";

/** Create/edit a client (FR-A9 support, API.md 4.3). */
export function ClientForm({ client }: { client?: Client }) {
  return (
    <EntityForm
      action={saveClient.bind(null, client?.id ?? null)}
      redirectTo="/admin/clients"
      submitLabel={client ? "Save changes" : "Add client"}
      secondaryAction={
        <Link
          href="/admin/clients"
          className="text-small rounded-input text-slate px-2 font-semibold underline-offset-4 hover:underline"
        >
          Cancel
        </Link>
      }
    >
      {(errors) => (
        <Card className="flex flex-col gap-5">
          <TextField
            label="Name"
            name="name"
            required
            defaultValue={client?.name}
            error={errors.name}
          />
          <TextField
            label="Business name"
            name="business_name"
            defaultValue={client?.businessName ?? ""}
            error={errors.business_name}
          />
          <TextField
            label="Phone"
            name="phone"
            type="tel"
            defaultValue={client?.phone ?? ""}
            error={errors.phone}
            hint="Used for the one-tap WhatsApp reply."
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            error={errors.email}
          />
          <TextAreaField
            label="Notes"
            name="notes"
            rows={4}
            defaultValue={client?.notes ?? ""}
            error={errors.notes}
          />
        </Card>
      )}
    </EntityForm>
  );
}
