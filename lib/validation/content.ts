import { z } from "zod";

/**
 * Content schemas (API.md 4.1, 4.2, 8).
 *
 * Shared by every admin form and the action behind it, so the rules cannot
 * drift between what the UI accepts and what the server stores.
 */

/**
 * URL-safe slug.
 *
 * Lower-case letters, digits and single hyphens. Enforced here as well as by
 * the database's unique index, because a slug is a public URL and a bad one
 * is a broken page rather than just a bad row.
 */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "A slug is required.")
  .max(100, "That slug is too long.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lower-case letters, numbers and single hyphens, like business-systems.",
  );

/** Turns a title into a usable slug suggestion. */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      /* Strip accents so "Kiswahili à la carte" does not become "---". */
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100)
  );
}

/** A textarea of one item per line becomes a string[]; blank lines dropped. */
const linesToArray = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  );

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null);

/* ----------------------------------------------------------------- services */

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Give the service a name.").max(120),
  slug: slugSchema,
  icon: optionalText(40),
  short_desc: optionalText(300),
  full_desc: optionalText(4000),
  whatsapp_message: optionalText(400),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  visible: z.coerce.boolean().default(true),
});

export type ServiceValues = z.infer<typeof serviceSchema>;

/* ----------------------------------------------------------------- products */

export const productBadgeSchema = z.enum([
  "none",
  "coming_soon",
  "new",
  "popular",
]);

export const productSchema = z.object({
  name: z.string().trim().min(2, "Give the product a name.").max(120),
  slug: slugSchema,
  description: optionalText(2000),
  features: linesToArray,
  images: linesToArray,
  pricing_text: optionalText(200),
  badge: productBadgeSchema.default("none"),
  whatsapp_message: optionalText(400),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  visible: z.coerce.boolean().default(true),
});

export type ProductValues = z.infer<typeof productSchema>;

/* ---------------------------------------------------------------- portfolio */

export const portfolioSchema = z.object({
  title: z.string().trim().min(2, "Give the project a title.").max(120),
  slug: slugSchema,
  type: optionalText(120),
  description: optionalText(4000),
  images: linesToArray,
  technologies: linesToArray,
  live_url: z
    .string()
    .trim()
    .max(400)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), {
      message: "Enter a full URL starting with http:// or https://",
    })
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  visible: z.coerce.boolean().default(true),
});

export type PortfolioValues = z.infer<typeof portfolioSchema>;

/* -------------------------------------------------------------------- posts */

/**
 * Tiptap document.
 *
 * Validated as shape only — `{ type: "doc", content: [...] }` — not as a full
 * node grammar. The renderer walks this with an allowlist and drops anything
 * it does not recognise, so unknown nodes are already harmless, and a strict
 * schema here would reject documents from a future editor extension for no
 * safety gain.
 */
export const tiptapDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const postSchema = z.object({
  title: z.string().trim().min(2, "Give the post a title.").max(200),
  slug: slugSchema,
  summary: optionalText(400),
  cover_image: optionalText(400),
  body: tiptapDocSchema.nullable().default(null),
  meta_title: optionalText(200),
  meta_description: optionalText(300),
});

export type PostValues = z.infer<typeof postSchema>;

/* ----------------------------------------------------------------- settings */

export const settingsSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(1, "A company name is required.")
    .max(120),
  tagline: z.string().trim().max(200).default(""),
  /** E.164, the portable form. `lib/whatsapp` strips it down for wa.me. */
  whatsapp_number: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || /^\+?[1-9]\d{7,14}$/.test(v), {
      message: "Use international format, like +255747809299.",
    })
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  phone: optionalText(30),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email address.",
    })
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  location: optionalText(200),
  default_whatsapp_greeting: optionalText(400),
  socials: z.record(z.string(), z.string()).default({}),
  trust_stats: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(60),
        value: z.coerce.number().int().nullable(),
        suffix: z.string().trim().max(10).default(""),
      }),
    )
    .default([]),
});

export type SettingsValues = z.infer<typeof settingsSchema>;

/* ----------------------------------------------------------------- messages */

export const messageStatusSchema = z.enum(["new", "replied", "closed"]);
