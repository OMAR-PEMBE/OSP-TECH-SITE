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
import { saveService } from "@/app/actions/content";
import type { AdminService } from "@/lib/db/admin";

/** Create/edit a service (FR-A4). */

/* The icon keys `components/public/service-icon.tsx` knows how to render.
   A free-text field here would let someone save an icon that silently falls
   back to a wrench on the live site. */
const ICONS = [
  { value: "server", label: "Server — business systems" },
  { value: "globe", label: "Globe — websites" },
  { value: "workflow", label: "Workflow — automation" },
  { value: "sparkles", label: "Sparkles — AI" },
  { value: "bot", label: "Bot" },
  { value: "wrench", label: "Wrench — general" },
];

export function ServiceForm({ service }: { service?: AdminService }) {
  return (
    <EntityForm
      action={saveService.bind(null, service?.id ?? null)}
      redirectTo="/admin/services"
      submitLabel={service ? "Save changes" : "Create service"}
      secondaryAction={
        <Link
          href="/admin/services"
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
              label="Name"
              name="name"
              required
              defaultValue={service?.name}
              error={errors.name}
              placeholder="Business Systems"
            />
            <TextField
              label="Slug"
              name="slug"
              required
              defaultValue={service?.slug}
              error={errors.slug}
              hint="Used in the page link, like /services#business-systems."
              placeholder="business-systems"
            />
            <SelectField
              label="Icon"
              name="icon"
              options={ICONS}
              defaultValue={service?.icon ?? "wrench"}
              error={errors.icon}
            />
            <TextAreaField
              label="Short description"
              name="short_desc"
              rows={2}
              defaultValue={service?.shortDesc ?? ""}
              error={errors.short_desc}
              hint="One line. This is the card text on the home page."
            />
            <TextAreaField
              label="Full description"
              name="full_desc"
              rows={6}
              defaultValue={service?.fullDesc ?? ""}
              error={errors.full_desc}
              hint="Shown on the Services page."
            />
          </Card>

          <Card className="flex flex-col gap-5">
            <TextAreaField
              label="WhatsApp message"
              name="whatsapp_message"
              rows={2}
              defaultValue={service?.whatsappMessage ?? ""}
              error={errors.whatsapp_message}
              hint="Pre-filled when someone taps the WhatsApp button for this service."
            />
            <TextField
              label="Sort order"
              name="sort_order"
              type="number"
              min={0}
              defaultValue={service?.sortOrder ?? 0}
              error={errors.sort_order}
              hint="Lower numbers appear first."
            />
            <CheckboxField
              label="Show on the website"
              name="visible"
              defaultChecked={service?.visible ?? true}
              hint="Uncheck to hide without deleting."
            />
          </Card>
        </>
      )}
    </EntityForm>
  );
}
