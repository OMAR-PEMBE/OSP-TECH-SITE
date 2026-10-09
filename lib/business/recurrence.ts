/**
 * Recurrence maths for repeating reminders and expenses.
 *
 * A plain module, not part of the actions file: everything exported from a
 * `"use server"` file must be an async Server Action, and this is a pure
 * function the server calls internally.
 */

/** East Africa Time is a fixed UTC+3 with no daylight saving. */
const DAR_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * The next due date for a repeating item.
 *
 * Calendar arithmetic is done on the Dar es Salaam wall clock, not the
 * server's: "every month on the 1st at 01:00" is the 30th/31st at 22:00 in
 * UTC, and stepping the UTC calendar would land on the wrong day of the month.
 * The instant is shifted into EAT, stepped with the UTC accessors (which then
 * read EAT fields, independent of the server's own zone), and shifted back.
 *
 * Month arithmetic is clamped. Adding a month to 31 January would roll into
 * March and skip February entirely; pinning to the last valid day of the
 * target month keeps the series monthly.
 */
export function nextOccurrence(dueAt: string, rule: string): string {
  const wall = new Date(new Date(dueAt).getTime() + DAR_OFFSET_MS);

  if (rule === "daily") {
    wall.setUTCDate(wall.getUTCDate() + 1);
  } else if (rule === "weekly") {
    wall.setUTCDate(wall.getUTCDate() + 7);
  } else if (rule === "monthly") {
    const day = wall.getUTCDate();
    /* Move to the 1st first, so adding a month cannot overflow. */
    wall.setUTCDate(1);
    wall.setUTCMonth(wall.getUTCMonth() + 1);
    const lastDay = new Date(
      Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth() + 1, 0),
    ).getUTCDate();
    wall.setUTCDate(Math.min(day, lastDay));
  }

  return new Date(wall.getTime() - DAR_OFFSET_MS).toISOString();
}
