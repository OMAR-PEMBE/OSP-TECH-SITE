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

/* ------------------------------------------------- Dar es Salaam wall time */

/**
 * East Africa Time is a fixed UTC+3 — Tanzania has not observed daylight
 * saving since the 1960s — so a constant offset is exact, and needs no tz
 * database on the server.
 *
 * Everything below exists because `new Date().getHours()`, `setHours()` and
 * `toISOString().slice(0, 10)` all answer in the *server's* timezone, which on
 * Vercel is UTC. Used for "today" or for a time the owner typed, that is three
 * hours wrong in Morogoro.
 */
export const DAR_UTC_OFFSET = "+03:00";
const DAR_OFFSET_MS = 3 * 60 * 60 * 1000;

/** The calendar fields of an instant, as a clock in Dar es Salaam reads them. */
function darFields(date: Date) {
  /* Shift by the offset and read the UTC fields: exact for a fixed offset,
     and identical on any server whatever its own timezone. */
  const shifted = new Date(date.getTime() + DAR_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** `Date` → `"YYYY-MM-DD"`, the date in Dar es Salaam. For `<input type=date>`. */
export function toDarDateInput(date: Date = new Date()): string {
  const f = darFields(date);
  return `${f.year}-${pad2(f.month)}-${pad2(f.day)}`;
}

/** `Date` → `"YYYY-MM-DDTHH:mm"` in Dar es Salaam. For `datetime-local`. */
export function toDarDateTimeInput(date: Date): string {
  const f = darFields(date);
  return `${toDarDateInput(date)}T${pad2(f.hour)}:${pad2(f.minute)}`;
}

/** First day of the current month in Dar es Salaam, as `"YYYY-MM-01"`. */
export function darMonthStart(date: Date = new Date()): string {
  const f = darFields(date);
  return `${f.year}-${pad2(f.month)}-01`;
}

/**
 * The instant a Dar es Salaam wall-clock time names.
 *
 * `datetime-local` posts `"2026-10-04T14:30"` with no zone, and
 * `new Date(that)` would read it in the server's zone. This pins it to EAT.
 * Returns null for anything that is not that exact shape, so a caller cannot
 * silently fall back to the server-local reading.
 */
export function parseDarDateTime(value: string): Date | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value.trim(),
  );
  if (!match) return null;
  const [, day, hh, mm, ss = "00"] = match;
  const date = new Date(`${day}T${hh}:${mm}:${ss}${DAR_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Midnight at the start of the given `"YYYY-MM-DD"` day in Dar es Salaam. */
export function darStartOfDay(day: string): Date {
  return new Date(`${day}T00:00:00${DAR_UTC_OFFSET}`);
}

/** Adds whole calendar days to a `"YYYY-MM-DD"` string. */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
