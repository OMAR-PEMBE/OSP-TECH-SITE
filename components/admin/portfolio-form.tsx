"use client";

import Link from "next/link";
import { Card } from "@/components/admin/card";
import { EntityForm } from "@/components/admin/entity-form";
import {
  CheckboxField,
  TextAreaField,
  TextField,
} from "@/components/admin/form";
import { savePortfolioItem } from "@/app/actions/content";
import type { AdminPortfolioItem } from "@/lib/db/admin";

export function PortfolioForm({ item }: { item?: AdminPortfolioItem }) {
  return (
    <EntityForm
      action={savePortfolioItem.bind(null, item?.id ?? null)}
      redirectTo="/admin/portfolio"
      submitLabel={item ? "Save changes" : "Create project"}
      secondaryAction={
        <Link
          href="/admin/portfolio"
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
              defaultValue={item?.title}
              error={errors.title}
            />
            <TextField
              label="Slug"
              name="slug"
              required
              defaultValue={item?.slug}
              error={errors.slug}
              hint="The page link: /portfolio/your-slug"
            />
            <TextField
              label="Type"
              name="type"
              defaultValue={item?.type ?? ""}
              error={errors.type}
              placeholder="E-commerce website"
            />
            <TextAreaField
              label="Description"
              name="description"
              rows={5}
              defaultValue={item?.description ?? ""}
              error={errors.description}
            />
          </Card>

          <Card className="flex flex-col gap-5">
            <TextAreaField
              label="Technologies"
              name="technologies"
              rows={3}
              defaultValue={item?.technologies.join("\n") ?? ""}
              error={errors.technologies}
              hint="One per line."
            />
            <TextAreaField
              label="Image paths"
              name="images"
              rows={3}
              defaultValue={item?.images.join("\n") ?? ""}
              error={errors.images}
              hint="One storage path per line."
            />
            <TextField
              label="Live URL"
              name="live_url"
              type="url"
              defaultValue={item?.liveUrl ?? ""}
              error={errors.live_url}
              placeholder="https://example.co.tz"
            />
            <TextField
              label="Sort order"
              name="sort_order"
              type="number"
              min={0}
              defaultValue={item?.sortOrder ?? 0}
              error={errors.sort_order}
            />
            <CheckboxField
              label="Show on the website"
              name="visible"
              defaultChecked={item?.visible ?? true}
            />
          </Card>
        </>
      )}
    </EntityForm>
  );
}
