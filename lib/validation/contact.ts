import { z } from "zod";

/**
 * Contact form schema (API.md 3.1).
 *
 * One schema, imported by the form and by the Server Action, so the rules
 * cannot drift apart. The client use is a convenience that gives fast inline
 * errors; the server parse is the one that decides (agents.md 2.3).
 */

/**
 * Tanzanian phone numbers, accepted in the shapes people actually type:
 * `0747809299`, `+255747809299`, `255747809299`, with spaces or dashes.
 * Optional — plenty of visitors would rather be answered on WhatsApp only.
 */
const TZ_PHONE = /^(?:\+?255|0)[\s-]?[67]\d{2}[\s-]?\d{3}[\s-]?\d{3}$/;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please tell us your name.")
    .max(80, "That name is too long."),

  phone: z
    .string()
    .trim()
    .max(20, "That phone number is too long.")
    .refine((v) => v === "" || TZ_PHONE.test(v), {
      message: "Enter a Tanzanian number, like 0747 809 299.",
    })
    /* Empty string and "not given" are the same thing to the database. */
    .transform((v) => (v === "" ? undefined : v))
    .optional(),

  need: z
    .string()
    .trim()
    .max(120, "Please keep this short.")
    .transform((v) => (v === "" ? undefined : v))
    .optional(),

  message: z
    .string()
    .trim()
    .min(5, "Please tell us a little more.")
    .max(2000, "That message is too long — 2000 characters maximum."),

  /** Which page the message came from. Set by the form, not the visitor. */
  sourcePage: z.string().trim().max(200).optional(),

  /**
   * Honeypot. A real person never sees this field, so anything in it means a
   * script filled the form (security.md 5). Named `website` because that is
   * the sort of label bots autofill.
   */
  website: z.string().max(0, "Rejected.").optional(),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactValues = z.output<typeof contactSchema>;

/** Field names the form renders, kept in one place for the action's error map. */
export type ContactField = keyof ContactValues;
