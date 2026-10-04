import { z } from "zod";

/**
 * Clients, projects, reminders and finance schemas (API.md 4.3-4.6).
 *
 * Shared by the admin forms and the Server Actions behind them.
 */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null);

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: "Use a date in the form YYYY-MM-DD.",
  })
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .default(null);

/**
 * Money: whole TZS, as a `bigint` (agents.md 2.6, database.md 1).
 *
 * The form sends a string. It is validated as digits and converted straight
 * to BigInt — never through `Number`, because a large shilling amount would
 * silently lose precision above 2^53 and because `parseFloat("1.5")` would
 * quietly accept a fractional shilling that does not exist.
 *
 * Returned as a string, not a BigInt: `bigint` cannot cross the Server Action
 * boundary (it is not serialisable), and Postgres accepts a numeric string
 * for a bigint column, so the exact value survives the whole round trip.
 */
export const tzsAmountSchema = z
  .string()
  .trim()
  /* Strip spaces and separators people naturally type: "2,500,000". */
  .transform((v) => v.replace(/[\s,]/g, ""))
  .refine((v) => v !== "", { message: "Enter an amount." })
  .refine((v) => /^\d+$/.test(v), {
    message: "Enter whole shillings — digits only, no decimals.",
  })
  .refine((v) => BigInt(v) <= 9_223_372_036_854_775_807n, {
    message: "That amount is too large.",
  })
  .transform((v) => BigInt(v).toString());

export const paymentMethodSchema = z.enum([
  "mpesa",
  "mixx_tigo",
  "airtel_money",
  "halopesa",
  "bank",
  "cash",
  "other",
]);

export const PAYMENT_METHOD_LABELS: Record<
  z.infer<typeof paymentMethodSchema>,
  string
> = {
  mpesa: "M-Pesa",
  mixx_tigo: "Mixx by Tigo",
  airtel_money: "Airtel Money",
  halopesa: "HaloPesa",
  bank: "Bank transfer",
  cash: "Cash",
  other: "Other",
};

/* ------------------------------------------------------------------ clients */

export const clientSchema = z.object({
  name: z.string().trim().min(2, "Give the client a name.").max(120),
  phone: optionalText(30),
  email: optionalText(200),
  business_name: optionalText(160),
  notes: optionalText(4000),
});

export type ClientValues = z.infer<typeof clientSchema>;

/* ----------------------------------------------------------------- projects */

export const projectTypeSchema = z.enum([
  "custom_system",
  "website",
  "system_rental",
  "automation",
  "ai",
  "other",
]);

export const PROJECT_TYPE_LABELS: Record<
  z.infer<typeof projectTypeSchema>,
  string
> = {
  custom_system: "Custom system",
  website: "Website",
  system_rental: "System rental",
  automation: "Automation",
  ai: "AI",
  other: "Other",
};

export const projectStatusSchema = z.enum([
  "planning",
  "in_progress",
  "testing",
  "completed",
  "on_hold",
  "cancelled",
]);

export const PROJECT_STATUS_LABELS: Record<
  z.infer<typeof projectStatusSchema>,
  string
> = {
  planning: "Planning",
  in_progress: "In progress",
  testing: "Testing",
  completed: "Completed",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

/** The four columns the kanban shows (prd.md 5.2, UI-UX.md 7). */
export const KANBAN_COLUMNS = [
  "planning",
  "in_progress",
  "testing",
  "completed",
] as const;

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Give the project a name.").max(160),
  client_id: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  type: projectTypeSchema.default("other"),
  description: optionalText(4000),
  price: tzsAmountSchema.default("0"),
  start_date: optionalDate,
  deadline: optionalDate,
  status: projectStatusSchema.default("planning"),
  notes: optionalText(4000),
});

export type ProjectValues = z.infer<typeof projectSchema>;

export const projectTaskSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title.").max(200),
});

/* ---------------------------------------------------------------- reminders */

export const repeatRuleSchema = z.enum(["none", "daily", "weekly", "monthly"]);

export const REPEAT_LABELS: Record<z.infer<typeof repeatRuleSchema>, string> = {
  none: "Does not repeat",
  daily: "Every day",
  weekly: "Every week",
  monthly: "Every month",
};

export const reminderSchema = z.object({
  title: z.string().trim().min(2, "Give the reminder a title.").max(200),
  description: optionalText(2000),
  /**
   * `datetime-local` sends "2026-10-04T14:30" with no timezone. It is read as
   * the owner's local time, which is the only sensible reading of a time they
   * just typed, and stored as a timestamptz.
   */
  due_at: z
    .string()
    .trim()
    .min(1, "Choose when this is due.")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), {
      message: "That date could not be read.",
    })
    .transform((v) => new Date(v).toISOString()),
  repeat_rule: repeatRuleSchema.default("none"),
  project_id: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  client_id: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  notify_email: z.coerce.boolean().default(true),
});

export type ReminderValues = z.infer<typeof reminderSchema>;

/* ------------------------------------------------------------------ finance */

export const incomeSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  amount: tzsAmountSchema,
  client_id: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  project_id: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  method: paymentMethodSchema.default("mpesa"),
  reference: optionalText(120),
  category: optionalText(120),
  notes: optionalText(2000),
});

export type IncomeValues = z.infer<typeof incomeSchema>;

export const expenseSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  amount: tzsAmountSchema,
  category_id: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  method: paymentMethodSchema.default("cash"),
  description: optionalText(2000),
  receipt_url: optionalText(400),
  recurring: repeatRuleSchema.default("none"),
});

export type ExpenseValues = z.infer<typeof expenseSchema>;

export const expenseCategorySchema = z.object({
  name: z.string().trim().min(1, "Give the category a name.").max(80),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});
