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
import { saveProduct } from "@/app/actions/content";
import type { AdminProduct } from "@/lib/db/admin";

const BADGES = [
  { value: "none", label: "No badge" },
  { value: "popular", label: "Popular" },
  { value: "new", label: "New" },
  { value: "coming_soon", label: "Coming soon" },
];

export function ProductForm({ product }: { product?: AdminProduct }) {
  return (
    <EntityForm
      action={saveProduct.bind(null, product?.id ?? null)}
      redirectTo="/admin/products"
      submitLabel={product ? "Save changes" : "Create product"}
      secondaryAction={
        <Link
          href="/admin/products"
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
              defaultValue={product?.name}
              error={errors.name}
            />
            <TextField
              label="Slug"
              name="slug"
              required
              defaultValue={product?.slug}
              error={errors.slug}
              hint="The page link: /products/your-slug"
            />
            <TextAreaField
              label="Description"
              name="description"
              rows={3}
              defaultValue={product?.description ?? ""}
              error={errors.description}
            />
            <TextAreaField
              label="Features"
              name="features"
              rows={5}
              defaultValue={product?.features.join("\n") ?? ""}
              error={errors.features}
              hint="One per line."
            />
          </Card>

          <Card className="flex flex-col gap-5">
            <TextField
              label="Pricing text"
              name="pricing_text"
              defaultValue={product?.pricingText ?? ""}
              error={errors.pricing_text}
              placeholder="Revenue share: 2.5% per transaction"
            />
            <SelectField
              label="Badge"
              name="badge"
              options={BADGES}
              defaultValue={product?.badge ?? "none"}
              error={errors.badge}
            />
            <TextAreaField
              label="WhatsApp message"
              name="whatsapp_message"
              rows={2}
              defaultValue={product?.whatsappMessage ?? ""}
              error={errors.whatsapp_message}
              hint="Pre-filled when someone asks about this product."
            />
            <TextAreaField
              label="Image paths"
              name="images"
              rows={3}
              defaultValue={product?.images.join("\n") ?? ""}
              error={errors.images}
              hint="One storage path per line. Upload images under Media."
            />
            <TextField
              label="Sort order"
              name="sort_order"
              type="number"
              min={0}
              defaultValue={product?.sortOrder ?? 0}
              error={errors.sort_order}
            />
            <CheckboxField
              label="Show on the website"
              name="visible"
              defaultChecked={product?.visible ?? true}
            />
          </Card>
        </>
      )}
    </EntityForm>
  );
}
