/**
 * Formatting helpers — TZS money and Dar es Salaam dates (agents.md 2.6).
 *
 * Money is a `bigint` of whole shillings everywhere it is stored or passed
 * around, and is turned into a string only here, at the point of display.
 * Floats never touch it: 0.1 + 0.2 problems in a finance table are not
 * recoverable, and TZS has no minor unit in practice.
 */

const TZS = new Intl.NumberFormat("en-TZ", {
  style: "currency",
  currency: "TZS",
  // Whole shillings — no cents exist in practice.
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** `1500000n` → `"TSh 1,500,000"`. */
export function formatTzs(amount: bigint | number): string {
  /* Intl cannot take a bigint directly. Shilling amounts are far below
     Number.MAX_SAFE_INTEGER (9.007e15), so this conversion is exact; it is
     asserted rather than assumed because silent precision loss in money is
     the exact failure this module exists to prevent. */
  const value = typeof amount === "bigint" ? Number(amount) : amount;
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(
      `Amount ${amount} exceeds the safe integer range and cannot be formatted exactly.`,
    );
  }
  return TZS.format(value);
}

/** The timezone the business actually operates in (database.md 1). */
export const TIME_ZONE = "Africa/Dar_es_Salaam";

const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const SHORT_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** `"2026-10-04T09:00:00Z"` → `"4 October 2026"`, in Dar es Salaam time. */
export function formatDate(value: string | Date): string {
  return LONG_DATE.format(toDate(value));
}

/** `"2026-10-04T09:00:00Z"` → `"4 Oct 2026"`, in Dar es Salaam time. */
export function formatDateShort(value: string | Date): string {
  return SHORT_DATE.format(toDate(value));
}

/**
 * ISO date for a `<time dateTime>` attribute.
 *
 * Deliberately the UTC instant, not the local rendering: the attribute is for
 * machines, and timestamps are stored as `timestamptz`.
 */
export function toDateTimeAttr(value: string | Date): string {
  return toDate(value).toISOString();
}

/**
 * A whole-TZS amount, typed for a `bigint` column.
 *
 * `supabase gen types` maps Postgres `bigint` to TypeScript `number`, because
 * that is the closest JSON primitive — but `number` cannot hold a shilling
 * amount above 2^53 exactly, which is the whole reason the column is a bigint.
 *
 * PostgREST accepts a numeric *string* for a bigint column and Postgres parses
 * it losslessly, so the string is the correct thing to send. This cast is the
 * type system catching up with the database, not a way around it: the value
 * has already been validated as digits-only by `tzsAmountSchema`.
 */
export function tzsForDb(wholeShillings: string): number {
  return wholeShillings as unknown as number;
}
